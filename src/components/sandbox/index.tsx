// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { transform as babelTransform } from "@babel/standalone";
import { parser, walk } from "./ast";

// 依赖库
import dayjs from "dayjs";
import lodash from "lodash";
import * as antd from "antd";

import { normalReactCompCode } from "./data";
import { cdn } from "@/constants";

let moduleDeps = {
  react: React,
  "react-dom": ReactDOM,
  // dayjs,
  // lodash,
  // antd,
};

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
      await fetch(`${cdn}/${nameAndVersion}/package.json`)
    ).json();

    // 请求模块源码
    // const sourceType = pkgJSON.module ? "es" : "commonjs";
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

interface IProps {
  code?: string;
}

export default (props: IProps) => {
  const { code = "" } = props;
  const viewRef = useRef<any>(null);
  // const [code, setCode] = useState(normalReactCompCode);

  useEffect(() => {
    // (async () => {
    //   await loadMod("lodash");
    //   await loadMod("dayjs");
    //   await loadMod("antd");
    //   // await loadMod("@alifd/next");
    // })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!code) {
        return;
      }

      // ast 解析源码
      const ast = parser.parse(normalReactCompCode, {
        sourceType: "module",
        ecmaVersion: "2020",
      });

      // 提取源码中依赖的模块
      const codeDeps = [];
      walk.simple(ast, {
        ImportDeclaration(node) {
          if (node && node.source && node.source.value) {
            codeDeps.push(node.source.value);
          }
        },
      });

      // TODO 优先加载依赖模块
      loadDeps(codeDeps);

      // 源码解析
      let esCode = babelTransform(normalReactCompCode, {
        presets: ["env", "es2015", "react"],
      }).code;

      console.log("esCode", esCode, moduleDeps);

      // 在线执行模块
      const e = await runCode(esCode);
      console.log("ret e", e);
    })();
  }, [code]);

  const loadDeps = (deps = []) => {};

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
