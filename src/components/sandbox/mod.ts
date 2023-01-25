import { cdnPrefix } from "@/constants";
import { transform as babelTransform } from "@babel/standalone";
import less from "less";
import React from "react";
import ReactDOM from "react-dom";
import { ICode } from "./index";

// 依赖库
import dayjs from "dayjs";
import lodash from "lodash";
// import * as antd from "antd";

export let moduleDeps: any = {
  react: React,
  "react-dom": ReactDOM,
  React,
  ReactDOM,
  _: lodash,
  dayjs,
  lodash,
  // antd,
};

export function runCode(code: string) {
  // 定义参数
  const e = {};
  const m = { exports: e };
  const r = function (name: string) {
    return moduleDeps[name];
  };

  try {
    // 浏览器执行源码
    const f = new Function("exports", "module", "require", "define", code);
    f.call(null, e, m, r, () => {});
    return m.exports;
  } catch (err) {
    console.log("run code error: ", err);
    return;
  }
}

// 从cdn动态加载模块并缓存
export const loadModFromCdn = async (
  nameAndVersion: string,
  depsVersion: any[] = [],
  innerCssList: ICode[] = []
) => {
  // 加载内置的样式，如/index.css路径
  if (/^\/.+\.(css|less)$/.test(nameAndVersion)) {
    const { path, value }: any =
      innerCssList.find((i: any) => i && i.path === nameAndVersion) || {};
    await insertModuleStyle(path, value);
    return;
  }
  // import其他库的css文件，如antd/dist/antd.css
  if (/\.css$/.test(nameAndVersion)) {
    await insertModuleCss(nameAndVersion, `${cdnPrefix}/${nameAndVersion}`);
    return;
  }

  if (moduleDeps[nameAndVersion]) {
    // console.log("mod cached: ", moduleDeps[nameAndVersion]);
    return moduleDeps[nameAndVersion];
  }

  let name = nameAndVersion;
  let version = "";

  // 若匹配到nameVersion中带有指定版本，则重新设置
  const matches = nameAndVersion.match(/^(.*)@(\d+\.\d+\.\d)$/);
  if (matches && matches[1] && matches[2]) {
    name = matches[1];
    version = matches[2];
  } else {
    // 如果匹配到指定依赖，则采用指定依赖的版本信息
    const dep: any = depsVersion.find(
      (i: any) => i && i.name === nameAndVersion
    );
    if (dep) {
      version = dep.version;
      name = dep.name;
    }
  }

  let pkgJSON = null;
  let entryFile = "";

  try {
    // 请求模块信息
    pkgJSON = await (
      await fetch(
        `${cdnPrefix}/${
          version && name ? `${name}@${version}` : nameAndVersion
        }/package.json`
      )
    ).json();

    // 请求模块入口文件
    entryFile =
      pkgJSON.unpkg || pkgJSON.browser || pkgJSON.module || pkgJSON.main || "";

    if (!pkgJSON || !entryFile) {
      throw new Error(`PkgJSON and mod entryFile doesn't exist.`);
    }
  } catch (err) {
    console.log("get mod info error: ", err);
    return moduleDeps[nameAndVersion];
  }

  try {
    // 请求模块源码
    let source = await (
      await fetch(`${cdnPrefix}/${nameAndVersion}/${entryFile}`)
    ).text();

    // es module 及 react 解析
    if (entryFile === pkgJSON.module) {
      source = babelTransform(source, {
        presets: ["env", "es2015", "react"],
      }).code as string;
    }

    const ret = runCode(source);
    if (ret !== undefined) {
      // 更新模块缓存
      moduleDeps[nameAndVersion] = ret;
    }
  } catch (err) {
    console.log("load mod error: ", err);
  }

  // console.log("mod loaded: ", moduleDeps[nameAndVersion]);
  return moduleDeps[nameAndVersion];
};

// 为了保证扩展的样式优先级高于业务动态样式（在head中），所以插入扩展样式在body内头部或body中已存在的link标签之后
export const insertModuleCss = async (name: string, css: string) => {
  return new Promise(function (resolve) {
    if (!name || !css) {
      resolve(false);
      return;
    }

    // 找出body内部含有module属性的link标签，然后追加到最后一个link后面，如果没有则追加到body的第一个子元素前面
    const bodyLinks = Array.from(
      document.body.getElementsByTagName("link")
    ).filter((i) => i && i.getAttribute("module"));

    const existElement = bodyLinks.find((i) => i.getAttribute("href") === css);
    // 若已存在外部模块的样式文件，则只需要变更link标签位置即可
    if (existElement) {
      if (bodyLinks[bodyLinks.length - 1].nextSibling) {
        document.body.insertBefore(
          existElement,
          bodyLinks[bodyLinks.length - 1].nextSibling
        );
      } else {
        document.body.appendChild(existElement);
      }
      resolve(true);
    } else {
      const element = document.createElement("link");
      element.setAttribute("module", name);
      element.rel = "stylesheet";
      element.href = css;
      element.addEventListener(
        "error",
        function () {
          console.log("css asset loaded error: ", css);
          return resolve(false);
        },
        false
      );
      element.addEventListener(
        "load",
        function () {
          return resolve(true);
        },
        false
      );

      if (bodyLinks.length > 0) {
        if (bodyLinks[bodyLinks.length - 1].nextSibling) {
          document.body.insertBefore(
            element,
            bodyLinks[bodyLinks.length - 1].nextSibling
          );
        } else {
          document.body.appendChild(element);
        }
      } else {
        if (document.body.firstChild) {
          document.body.insertBefore(element, document.body.firstChild);
        } else {
          document.body.appendChild(element);
        }
      }
    }
  });
};

// 清除带有module属性的link标签
export const cleanModuleCss = () => {
  const bodyLinks = Array.from(
    document.body.getElementsByTagName("link")
  ).filter((i) => i && i.getAttribute("module"));
  for (let i = 0; i < bodyLinks.length; i++) {
    bodyLinks[i].parentNode?.removeChild(bodyLinks[i]);
  }
};

// 添加模块内置的css style标签样式，为了保证扩展的样式优先级高于业务动态样式（在head中），所以插入扩展样式在body内头部或body中已存在的模块link标签之后
export const insertModuleStyle = async (name: string, styleContent: string) => {
  let content = styleContent || "";
  if (/less$/.test(name)) {
    try {
      const ret = (await less.render(content, { compress: true })) || {};
      content = ret.css || "";
    } catch (err) {
      console.log("less style error: ", err);
      content = "";
    }
  }

  return new Promise((resolve) => {
    if (!name || !styleContent) {
      resolve(false);
      return;
    }

    const style: any = document.createElement("style");
    style.innerHTML = content;
    style.setAttribute("module", name);

    style.addEventListener(
      "error",
      function () {
        console.log("style insert error: ", styleContent);
        return resolve(false);
      },
      false
    );
    style.addEventListener(
      "load",
      function () {
        return resolve(true);
      },
      false
    );

    // 找出body内部含有module属性的link标签以及含有module属性的style标签，若存在style标签，则追加到style标签之后；否则追加到最后一个link后面；如果link标签也没有，则追加到body的第一个子元素之前
    const bodyLinks = Array.from(
      document.body.getElementsByTagName("link")
    ).filter((i) => i && i.getAttribute("module"));
    const bodyStyles = Array.from(
      document.body.getElementsByTagName("style")
    ).filter((i) => i && i.getAttribute("module"));
    if (bodyStyles.length > 0) {
      if (bodyStyles[bodyStyles.length - 1].nextSibling) {
        document.body.insertBefore(
          style,
          bodyStyles[bodyStyles.length - 1].nextSibling
        );
      } else {
        document.body.appendChild(style);
      }
    } else if (bodyLinks.length > 0) {
      if (bodyLinks[bodyLinks.length - 1].nextSibling) {
        document.body.insertBefore(
          style,
          bodyLinks[bodyLinks.length - 1].nextSibling
        );
      } else {
        document.body.appendChild(style);
      }
    } else {
      if (document.body.firstChild) {
        document.body.insertBefore(style, document.body.firstChild);
      } else {
        document.appendChild(style);
      }
    }
  });
};

// 清除带有module属性的style标签
export const cleanModuleStyle = () => {
  const bodyStyles = Array.from(
    document.body.getElementsByTagName("style")
  ).filter((i) => i && i.getAttribute("module"));
  for (let i = 0; i < bodyStyles.length; i++) {
    bodyStyles[i].parentNode?.removeChild(bodyStyles[i]);
  }
};
