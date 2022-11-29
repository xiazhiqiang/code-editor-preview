import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { parser, walk } from "./ast";
import { loadMod, runCode, babelTransform } from "./mod";
import styles from "./index.module.less";

interface IProps {
  code?: string;
}

export default (props: IProps) => {
  const { code = "" } = props;
  const viewRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (!code) {
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

      // TODO: error boundary
      if (e && e.default) {
        // 卸载
        ReactDOM.unmountComponentAtNode(viewRef.current);
        // 渲染到节点上
        ReactDOM.render(<e.default />, viewRef.current);
      }
    })();
  }, [code]);

  return (
    <div className={styles.container}>
      <div ref={viewRef} />
    </div>
  );
};
