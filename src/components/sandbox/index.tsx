// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { transform as babelTransform } from "@babel/standalone";
// import { transform as _transform } from "sucrase";

// 依赖库
import dayjs from "dayjs";
import lodash from "lodash";
import * as antd from "antd";
import { normalReactCompCode } from "./data";

const moduleCdn = "https://unpkg.com"; // "https://cdn.jsdelivr.net/npm"
let moduleDeps = {
  react: React,
  "react-dom": ReactDOM,
  // dayjs,
  // lodash,
  // antd,
};

// function transformCode(code, opts = {}) {
//   opts = Object.assign({}, { transforms: ["jsx", "imports"] }, opts);
//   return _transform(code, opts).code;
// }

async function runCode(code) {
  // 定义参数
  const e = {};
  const m = { exports: e };
  const r = function (name) {
    return moduleDeps[name];
  };

  try {
    // 浏览器执行源码
    new Function("exports", "module", "require", code)(e, m, r);
    return m.exports;
  } catch (err) {
    console.log("run code error: ", err);
    return;
  }
}

async function loadMod(nameAndVersion) {
  if (moduleDeps[nameAndVersion]) {
    console.log("mod cached: ", moduleDeps[nameAndVersion]);
    return moduleDeps[nameAndVersion];
  }

  try {
    // 请求模块信息
    const pkgJSON = await (
      await fetch(`${moduleCdn}/${nameAndVersion}/package.json`)
    ).json();

    // 请求模块源码
    // const sourceType = pkgJSON.module ? "es" : "commonjs";
    const entryFile =
      pkgJSON.unpkg || pkgJSON.browser || pkgJSON.module || pkgJSON.main || "";
    let source = await (
      await fetch(`${moduleCdn}/${nameAndVersion}/${entryFile}`)
    ).text();

    // es module 及 react 解析
    if (entryFile === pkgJSON.module) {
      source = babelTransform(source, {
        presets: ["env", "es2015", "react"],
      }).code;
      // source = transformCode(source);
    }

    const ret = await runCode(source);
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

export default () => {
  const viewRef = useRef<any>(null);
  const [code, setCode] = useState(normalReactCompCode);

  useEffect(() => {
    (async () => {
      await loadMod("lodash");
      await loadMod("dayjs");
      await loadMod("antd");
      // await loadMod("@alifd/next");
    })();
  }, []);

  return (
    <div className="container" style={{ display: "flex" }}>
      <button
        onClick={async () => {
          // TODO ast 解析出源码中的依赖模块，然后loadMod

          // React&ES6 代码解析
          let esCode = babelTransform(code, {
            presets: ["env", "es2015", "react"],
          }).code;
          // let esCode = transformCode(code);
          console.log("esCode", esCode);

          console.log("moduleDeps", moduleDeps);

          // 在线执行模块
          const e = await runCode(esCode);
          console.log("ret e", e);

          // 渲染到节点上
          ReactDOM.render(<e.default />, viewRef.current);
        }}
      >
        运行
      </button>
      <br />
      <div ref={viewRef}></div>
      {/* <pre>{code}</pre> */}
    </div>
  );
};
