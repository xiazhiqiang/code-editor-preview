import React from "react";
import ReactDOM from "react-dom";
// @ts-ignore
import { transform as babelTransform } from "@babel/standalone";
import { cdn } from "@/constants";

// 依赖库
import dayjs from "dayjs";
import lodash from "lodash";
import * as antd from "antd";

let moduleDeps: any = {
  react: React,
  "react-dom": ReactDOM,
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

async function loadMod(nameAndVersion: string) {
  if (moduleDeps[nameAndVersion]) {
    console.log("mod cached: ", moduleDeps[nameAndVersion]);
    return moduleDeps[nameAndVersion];
  }

  try {
    // 请求模块信息
    const pkgJSON = await (
      await fetch(`${cdn}/${nameAndVersion}/package.json`)
    ).json();

    // 请求模块源码
    const entryFile =
      pkgJSON.unpkg || pkgJSON.browser || pkgJSON.module || pkgJSON.main || "";
    let source = await (
      await fetch(`${cdn}/${nameAndVersion}/${entryFile}`)
    ).text();

    // es module 及 react 解析
    if (entryFile === pkgJSON.module) {
      source = babelTransform(source, {
        presets: ["env", "es2015", "react"],
      }).code;
    }

    const ret = runCode(source);
    if (ret !== undefined) {
      // 更新模块缓存
      moduleDeps[nameAndVersion] = ret;
    }
  } catch (err) {
    console.log("load mod error: ", err);
  }

  console.log("mod loaded: ", moduleDeps[nameAndVersion]);
  return moduleDeps[nameAndVersion];
}

export { babelTransform, loadMod, runCode, moduleDeps };
