import React, { useState, useEffect } from "react";
import { Spin } from "antd";
// @ts-ignore
import * as babelParser from "@babel/parser";
import babelTraverse from "@babel/traverse";
import { transform as babelTransform } from "@babel/standalone";
import { loadMod, runCode } from "./mod";
import ErrorBoundary from "./errorBoundary";
import styles from "./index.module.less";

interface IProps {
  code?: string;
}

export default (props: IProps) => {
  const { code = "" } = props;
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
    setLoading(true);

    (async () => {
      try {
        if (!code) {
          setComp("");
          setLoading(false);
          return;
        }

        // ast 解析源码
        const ast = babelParser.parse(code, {
          sourceType: "module",
          plugins: ["jsx"],
        });

        // 提取源码中依赖的模块
        const codeDeps: string[] = [];
        babelTraverse(ast, {
          ImportDeclaration: (path) => {
            if (
              path &&
              path.node &&
              path.node.source &&
              path.node.source.value
            ) {
              codeDeps.push(path.node.source.value);
            }
          },
        });

        for (let i = 0, len = codeDeps.length; i < len; i++) {
          await loadMod(codeDeps[i]);
        }

        // 源码解析
        let esCode = babelTransform(code, {
          presets: ["env", "es2015", "react"],
        }).code as string;

        // 在线执行模块
        const e: any = runCode(esCode);
        console.log("ret e", e);

        setComp(e && e.default ? <e.default /> : null);
        setError(null);
      } catch (err) {
        // console.log("code error", err);
        setError(err);
      }

      setLoading(false);
    })();
  }, [code]);

  return (
    <div className={styles.container}>
      <Spin
        size="large"
        tip="Loading..."
        spinning={loading}
        style={{ minHeight: "100vh", width: "100%", color: "#fff" }}
      >
        <ErrorBoundary error={error} onError={setError}>
          {Comp}
        </ErrorBoundary>
      </Spin>
    </div>
  );
};
