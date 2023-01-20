import React from "react";
import ReactDOM from "react-dom";
import { transform as babelTransform } from "@babel/standalone";
import { cdnPrefix } from "@/constants";

// // 依赖库
// import dayjs from "dayjs";
// import lodash from "lodash";
// import * as antd from "antd";

export let moduleDeps: any = {
  react: React,
  "react-dom": ReactDOM,
  React,
  ReactDOM,
  // _: lodash,
  // dayjs,
  // lodash,
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
  depsVersion: any[] = []
) => {
  // 若import依赖是css文件，则通过加载css文件方式
  if (/\.css$/.test(nameAndVersion)) {
    await appendModuleCss({
      moduleCSS: [`${cdnPrefix}/${nameAndVersion}`],
      name: nameAndVersion,
    });
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

/**
 * 追加模块样式文件到dom中，过滤掉已存在的moduleCSS
 */
export const appendModuleCss = async (
  { moduleCSS = [], name = "" }: any,
  forceUpdate = false
) => {
  if (!name) {
    return Promise.resolve(false);
  }

  // 过滤掉已加载的模块样式，避免浏览器多次回流或重绘
  const links = Array.from(document.getElementsByTagName("link"));

  let cssList = [...moduleCSS];
  if (forceUpdate) {
    // 清除已加载的link css
    removeModuleCss(cssList);
  } else {
    cssList = moduleCSS.filter((href: string) =>
      links.findIndex(
        (link) =>
          (link.getAttribute("href") || "").replace(/http[s]?:/g, "") ===
          href.replace(/http[s]?:/g, "")
      ) >= 0
        ? false
        : true
    );
  }

  await Promise.all(cssList.map((css: string) => insertModuleCss(name, css)));
  return Promise.resolve(true);
};

/**
 * 为了保证扩展的样式优先级高于业务动态样式（在head中），所以插入扩展样式在body内头部或body中已存在的link标签之后
 * @param name
 * @param css
 * @returns
 */
export const insertModuleCss = async (name: string, css: string) => {
  return new Promise(function (resolve) {
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

    const bodyLinks = document.body.getElementsByTagName("link") || [];
    document.body.insertBefore(
      element,
      bodyLinks.length > 0 && bodyLinks[bodyLinks.length - 1].nextSibling
        ? bodyLinks[bodyLinks.length - 1].nextSibling
        : document.body.firstChild
    );
  });
};

export const removeModuleCss = (cssList: string[]) => {
  if (!cssList || cssList.length < 1) {
    return;
  }
  Array.from(document.getElementsByTagName("link")).forEach((link: any) => {
    if (
      cssList.findIndex(
        (href) =>
          href.replace(/http[?]:/g, "") ===
          (link.getAttribute("href") || "").replace(/http[?]:/g, "")
      ) >= 0
    ) {
      link.parentNode.removeChild(link);
    }
  });
};

// 清除带有module属性的css样式
export const cleanModuleCSS = () => {
  Array.from(document.getElementsByTagName("link")).forEach((link: any) => {
    if (link.getAttribute("module")) {
      link.parentNode.removeChild(link);
    }
  });
};
