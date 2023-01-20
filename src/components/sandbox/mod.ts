import React from "react";
import ReactDOM from "react-dom";
import { transform as babelTransform } from "@babel/standalone";
import { cdnPrefix } from "@/constants";

// // 依赖库
// import dayjs from "dayjs";
// import lodash from "lodash";
// import * as antd from "antd";

let moduleDeps: any = {
  react: React,
  "react-dom": ReactDOM,
  React,
  ReactDOM,
  // _: lodash,
  // dayjs,
  // lodash,
  // antd,
};

function runCode(code: string) {
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
async function loadModFromCdn(nameAndVersion: string, depsVersion: any[] = []) {
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
}

export { loadModFromCdn, runCode, moduleDeps };
