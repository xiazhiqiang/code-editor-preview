// @ts-nocheck
import React from "react";
import ReactDOM from "react-dom";
import ObjPath from "object-path";
import { parse } from "acorn";
import { generate as generateJs } from "escodegen";
import { transform as babelTransform } from "@babel/standalone";

// 搜索目标节点
export function findReactNode(ast) {
  // ast标准结构 body
  const { body } = ast;

  // 自定义一个迭代器
  return body.find((node) => {
    // 根据React.createElement匹配吧~
    const { type } = node;
    // 这个ObjPath类似lodash的get
    const obj = ObjPath.get(node, "expression.callee.object.name");
    const func = ObjPath.get(node, "expression.callee.property.name");

    return (
      type === "ExpressionStatement" &&
      obj === "React" &&
      func === "createElement"
    );
  });
}

// 动态创建方法
export function createEditor(domElement, moduleResolver = () => null) {
  // 运行时的入参，带入方法用的
  function render(node) {
    ReactDOM.render(node, domElement);
  }

  // 同上
  function require(moduleName) {
    return moduleResolver(moduleName);
  }

  // 核心
  function getWrapperFunction(code) {
    try {
      // 1. 一大窜React&ES6代码谁认识，先得降级吧
      const esCode = babelTransform(code, {
        presets: ["es2015", "react"],
      }).code;

      // 2. 原生代码toAst(这里暂用acorn、babel、eslint 都符合 ESTree Spec标准， 传送门：https://github.com/estree/estree)
      const ast = parse(esCode, {
        sourceType: "module",
      });

      // 3. 我们的目的是把jsx => js并且运行React.createElement
      //    所以得先到jsx装在的部分
      const rnode = findReactNode(ast);

      // 4. 如果找到了运行语句，接下来必须要包装render方法在React.createElemnet外面才能运行吧
      if (rnode) {
        // 先找到位置，便于后面直接替换
        const nodeIndex = ast.body.indexOf(rnode);
        // 生成字符串，截掉没用的信息
        const createElSrc = generateJs(rnode).slice(0, -1);
        // 重新生成改造后的ast - 可以执行的语句
        const renderCallAst = parse(`render(${createElSrc})`).body[0];
        ast.body[nodeIndex] = renderCallAst;
      }

      // 5. 完事具备运行起来吧，eval效率贼低不说还不安全，new Function吧
      // 运行时方法很多，尤其在node端 vm库 - runInThisContext等
      // 前面三个入参，后面是函数体
      return new Function("React", "render", "require", generateJs(ast));
    } catch ({ message }) {
      // 兜底
      render(<pre style={{ color: "red" }}>{message}</pre>);
    }
  }

  // 查看编译结果
  function compile(code) {
    return getWrapperFunction(code);
  }

  // 妈的前面的核心不能暴露，还是返回方法吧
  return {
    // 直接运行
    run: (code) => {
      console.log("compile", compile);
      compile(code)(React, render, require);
    },
    // 查看生成的字符串
    getCompiledCode: (code) => {
      return getWrapperFunction(code).toString();
    },
  };
}
