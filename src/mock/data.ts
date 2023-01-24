import { defaultCompJsx } from "@/constants/index";
import { transform as babelTransform } from "@babel/standalone";
import { moduleDeps, runCode } from "../components/sandbox/mod";

export const testCode = () => {
  // React&ES6 代码解析
  let esCode = babelTransform(defaultCompJsx, {
    presets: ["env", "es2015", "react"],
  }).code as string;
  console.log("esCode", esCode);
  console.log("moduleDeps", moduleDeps);

  // 在线执行模块
  const e = runCode(esCode);
  console.log("ret e", e);
};
