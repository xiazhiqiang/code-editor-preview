import React, { useState, useEffect, useCallback } from "react";
import { Spin } from "antd";
import { parser, walk } from "./ast";
import { loadMod, runCode, babelTransform } from "./mod";
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
        const ast = parser.parse(code, {
          sourceType: "module",
          ecmaVersion: 2020,
        });

        // 提取源码中依赖的模块
        const codeDeps: string[] = [];
        walk.simple(ast, {
          ImportDeclaration(node: any) {
            if (node && node.source && node.source.value) {
              codeDeps.push(node.source.value);
            }
          },
        });

        for (let i = 0, len = codeDeps.length; i < len; i++) {
          await loadMod(codeDeps[i]);
        }

        // 源码解析
        let esCode = babelTransform(code, {
          presets: ["env", "es2015", "react"],
        }).code;

        // 在线执行模块
        const e: any = runCode(esCode);
        console.log("ret e", e);

        setError(null);
        setComp(e && e.default ? <e.default /> : null);
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
