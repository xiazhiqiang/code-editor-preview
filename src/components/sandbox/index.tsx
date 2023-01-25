import React, { useState, useEffect } from "react";
import { Spin } from "antd";
import * as babelParser from "@babel/parser";
import babelTraverse from "@babel/traverse";
import { transform as babelTransform } from "@babel/standalone";
import { loadModFromCdn, runCode, cleanModuleStyle } from "./mod";
import ErrorBoundary from "./errorBoundary";
import "./index.less";

export interface ICode {
  path?: string;
  value?: string;
  storeKey?: string;
  isCss?: boolean;
  isEntry?: boolean;
}

interface IProps {
  codes?: ICode[];
  depsVersion?: {
    name: string;
    version: string;
  }[];
}

export default (props: IProps) => {
  const { codes = [], depsVersion = [] } = props;
  const [Comp, setComp] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const errorHandler = (event: any) => {
    setError(event.error);
  };

  useEffect(() => {
    window.onerror = (message, source, lineno, colno, newError: any) => {
      // console.log("window on error:", message, source, lineno, colno, newError);
      setError(newError);
      return true;
    };

    return () => {
      window.onerror = null;
    };
  }, []);

  useEffect(() => {
    window.addEventListener("error", errorHandler, false);

    return () => {
      window.removeEventListener("error", errorHandler, false);
    };
  }, []);

  useEffect(() => {
    // 入口jsx文件为空
    if (
      !codes ||
      codes.length < 1 ||
      !codes.find((i) => i && i.isEntry && i.value)
    ) {
      return;
    }

    (async () => {
      setLoading(true);

      // 入口jsx文件为空
      const jsx: ICode = codes.find((i) => i && i.isEntry) || {};
      const innerCssList: ICode[] = codes.filter((i) => i && i.isCss) || [];
      try {
        const ret: any = await runJsxCode(jsx.value as string, innerCssList);
        setComp(ret && ret.default ? <ret.default /> : null);
        setError(null);
      } catch (err) {
        setError(err);
      }

      setLoading(false);
    })();
  }, [codes]);

  // 执行jsx代码
  const runJsxCode = async (code: string, innerCssList: ICode[] = []) => {
    // ast 解析源码
    const ast = babelParser.parse(code, {
      sourceType: "module",
      plugins: ["jsx"],
    });

    // 提取源码中依赖的模块
    const codeDeps: string[] = [];
    babelTraverse(ast, {
      ImportDeclaration: (path) => {
        if (path && path.node && path.node.source && path.node.source.value) {
          codeDeps.push(path.node.source.value);
        }
      },
    });

    // 清除模块style标签
    cleanModuleStyle();

    for (let i = 0, len = codeDeps.length; i < len; i++) {
      await loadModFromCdn(codeDeps[i], depsVersion, innerCssList);
    }

    // 源码解析
    let esCode = babelTransform(code, {
      presets: ["env", "es2015", "react"],
    }).code as string;

    // 在线执行模块
    const ret = runCode(esCode);
    // console.log("ret", ret);
    return ret;
  };

  return (
    <Spin
      size="large"
      tip="Loading..."
      spinning={loading}
      className="sandbox-loading"
    >
      <ErrorBoundary error={error} onError={setError}>
        {Comp}
      </ErrorBoundary>
    </Spin>
  );
};
