import React, { useEffect, useMemo, useRef, useState } from "react";
import { loader } from "@monaco-editor/react";
import { message, Spin, Tag } from "antd";
import {
  RightSquareOutlined,
  LeftSquareOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import storage from "store2";
import debounce from "lodash/debounce";
import {
  cdnPrefix,
  defaultCompCss,
  defaultCompJsx,
  defaultCompTsx,
  defaultCompLess,
  defaultCompScss,
  editorSaveCssKey,
  editorSaveJsxKey,
  editorSaveTsxKey,
  editorSaveLessKey,
  editorSaveScssKey,
  editorTsCompilerOptions,
} from "@/constants/index";
import "./index.less";

// 编辑器配置
loader.config({
  paths: {
    vs: `${cdnPrefix}/monaco-editor@0.34.1/min/vs`,
  },
  "vs/nls": {
    availableLanguages: {
      "*": "zh-cn", // on the editor, press right click to see the chinese words
    },
  },
});

// 编辑器状态
let editorStatus: any = {};

// 默认组件文件
const files = [
  // {
  //   path: "/index.jsx",
  //   storeKey: editorSaveJsxKey,
  //   value: defaultCompJsx,
  //   isEntry: true,
  // },
  {
    path: "/index.tsx",
    storeKey: editorSaveTsxKey,
    value: defaultCompTsx,
    isEntry: true,
  },
  {
    path: "/index.css",
    storeKey: editorSaveCssKey,
    value: defaultCompCss,
  },
  {
    path: "/index2.less",
    storeKey: editorSaveLessKey,
    value: defaultCompLess,
  },
  {
    path: "/index3.scss",
    storeKey: editorSaveScssKey,
    value: defaultCompScss,
  },
];

const getFileOptionsByPath = (path: string = "") => {
  let language = "javascript";
  let storeKey = editorSaveJsxKey;

  if (/jsx?$/.test(path)) {
    language = "javascript";
    storeKey = editorSaveJsxKey;
  }
  if (/tsx?$/.test(path)) {
    language = "typescript";
    storeKey = editorSaveTsxKey;
  }
  if (/css$/.test(path)) {
    language = "css";
    storeKey = editorSaveCssKey;
  }
  if (/less$/.test(path)) {
    language = "less";
    storeKey = editorSaveLessKey;
  }
  if (/s(a|c)ss$/.test(path)) {
    language = "scss";
    storeKey = editorSaveScssKey;
  }

  return { language, storeKey };
};

const getCodes = () => {
  return files.map((file: any) => {
    let { value = "", isEntry, storeKey, path } = file || {};
    const fileOptions = getFileOptionsByPath(path);

    // 从localStorage中取值，如果没有则展示默认的组件代码
    value = storage.local.get(storeKey) || value || "";
    if (isEntry && !value) {
      value = defaultCompJsx;
    }

    return {
      ...file,
      ...fileOptions,
      value,
    };
  });
};

export default (props: any) => {
  const {
    editorStyles = {},
    width = "100%",
    height = "100%",
    language = "javascript",
    onCodesSave = () => {},

    // 编辑器顶部操作及状态
    displaySandbox = true,
    toggleDisplaySandbox = () => {},
    fullScreenPreview = false,
    toggleFullScreenPreview = () => {},
  } = props;

  const [editor, setEditor] = useState<any>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [filesModifyState, setFilesModifyState] = useState({});

  const editorContainerRef = useRef<any>(null);

  const filePathRef = useRef<string>(filePath);
  filePathRef.current = useMemo(() => filePath, [filePath]);

  const filesModifyStateRef = useRef<any>({});
  filesModifyStateRef.current = useMemo(
    () => filesModifyState,
    [filesModifyState]
  );

  const transformEntryCode = async ({ editor, monaco }: any = {}) => {
    const codes = getCodes();
    const idx = codes.findIndex((i) => i && i.isEntry && i.value);

    // 将入口tsx文件转换为jsx
    if (idx >= 0 && monaco && editor && codes[idx].language === "typescript") {
      try {
        const { path } = codes[idx];

        // monaco-editor 提供了 Worker 编译代码 TypeScript 能力
        const model = monaco.editor
          .getModels()
          .find((model: any) => model && model.uri.path === path);
        if (model) {
          const uri = model.uri;
          const tsWorker =
            await monaco.languages.typescript.getTypeScriptWorker();
          const client = await tsWorker(uri);
          const result = await client.getEmitOutput(uri.toString());
          const files = result.outputFiles[0];
          codes[idx].value = files.text;
        }
      } catch (err) {
        console.log("editor typescript transform error: ", err);
      }
    }

    return Promise.resolve(codes);
  };

  const files: any = getCodes();

  useEffect(() => {
    loader
      .init()
      .then((monaco) => {
        const editor = monaco.editor.create(editorContainerRef.current, {
          // value,
          language,
          tabSize: 2,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
          theme: "vs-dark",
          automaticLayout: true,
          model: null,
        });

        setMonaco(monaco);
        setEditor(editor);

        // https://github.com/microsoft/monaco-editor/issues/264
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: true,
          noSyntaxValidation: true, // This line disables errors in jsx tags like <div>, etc.
        });
        const tsOptions = editorTsCompilerOptions(monaco);
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions(
          tsOptions
        );

        editor.onDidChangeModelContent(() => {
          modifyFile({ path: filePathRef.current, state: true });
        });

        // 初始化editor models
        files.forEach((file: any) => {
          const { language } = getFileOptionsByPath(file.path);
          monaco.editor.createModel(
            file.value,
            language,
            new monaco.Uri().with({ path: file.path })
            // monaco.Uri.file(file.path)
          );
        });

        // 获取入口文件路径
        const { path: entryFilePath = "" } =
          files.find((i: any) => i && i.isEntry) || {};
        setFilePath(entryFilePath);
        openFile({ editor, monaco, path: entryFilePath });

        // 初始触发更新
        (async () => {
          const codes = await transformEntryCode({ editor, monaco });
          onCodesSave(codes);
        })();
      })
      .catch((err) => {
        console.log("load editor error", err);
      });

    return () => {
      editor && editor.dispose();
    };
  }, []);

  useEffect(() => {
    if (!editor || !monaco || !filePath) {
      return;
    }

    let timer: any = null;

    // cmd + s 保存
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      // 保存之前格式化代码，会触发onDidChangeModelContent事件
      editor.getAction("editor.action.formatDocument").run();

      // 保存代码到localStorage
      message.destroy("editorSave");
      message.success({
        content: `${filePath.slice(1)}已保存`,
        key: "editorSave",
        style: {
          marginTop: "30vh",
        },
      });

      // 增加延迟防止在onDidChangeModelContent事件之前执行保存
      timer = setTimeout(() => {
        const v = editor.getValue();
        saveFile({ v, path: filePath });
      }, 100);
    });

    return () => {
      timer && clearTimeout(timer);
    };
  }, [editor, monaco, filePath]);

  // 监听编辑器resize变化，更新编辑器layout
  useEffect(() => {
    const observer = new ResizeObserver(
      debounce(() => {
        editor && editor.layout();
      }, 200)
    );
    observer.observe(editorContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [editor]);

  const modifyFile = ({ path = "", state = false } = {}) => {
    const newFilesModifyState: any = { ...filesModifyStateRef.current };
    newFilesModifyState[path] = state;
    setFilesModifyState(newFilesModifyState);
  };

  const saveFile = ({ v = "", path = "" }: any) => {
    const { storeKey } = getFileOptionsByPath(path);
    storage.local.set(storeKey, v, true);

    // 清空修改状态
    modifyFile({ path, state: false });

    // 获取所有文件最新的值，传递给外部
    (async () => {
      const codes = await transformEntryCode({ editor, monaco });
      onCodesSave(codes);
    })();
  };

  const openFile = ({ editor = null, monaco = null, path = "" }: any) => {
    if (!editor || !monaco) {
      return;
    }

    const model = monaco.editor
      .getModels()
      .find((model: any) => model.uri.path === path);
    model && editor.setModel(model);
  };

  const switchFile = ({ path = "" }) => {
    // 保存之前的文件路径编辑器状态
    editorStatus[filePath] = editor.saveViewState();

    if (path !== filePath) {
      // 切换编辑器
      openFile({ editor, monaco, path });
    }

    if (editorStatus[path]) {
      // 恢复编辑器的状态
      editor.restoreViewState(editorStatus[path]);
    }

    // 聚焦编辑器
    editor.focus();

    // 更新当前文件path
    path !== filePath && setFilePath(path);
  };

  return (
    <div className="editor-container">
      <Spin
        className="loading"
        spinning={!editor}
        tip="Loading..."
        size="large"
      />
      {editor ? (
        <div className="editor-top">
          <div
            className="file-tabs"
            style={{ width: `${files.length * 130}px` }}
          >
            {files.map((file: any = {}, idx: number) => {
              return (
                <Tag
                  key={`fileTabItem_${idx}`}
                  // color={
                  //   filePath === file.path ? "rgb(41,44,51)" : "rgb(34,37,42)"
                  // }
                  className={`file-tab ${
                    filePath === file.path ? "file-tab--focus" : ""
                  } ${
                    filesModifyStateRef.current[file.path]
                      ? "file-tab--modify"
                      : ""
                  }`}
                  onClick={() => switchFile({ path: file.path })}
                >
                  {filesModifyStateRef.current[file.path] ? "* " : ""}
                  {file.path.slice(1)}
                </Tag>
              );
            })}
          </div>
        </div>
      ) : null}

      {editor ? (
        <div className="editor-actions">
          {displaySandbox ? (
            <RightSquareOutlined onClick={toggleDisplaySandbox} />
          ) : (
            <LeftSquareOutlined onClick={toggleDisplaySandbox} />
          )}
          {fullScreenPreview ? (
            <FullscreenExitOutlined onClick={toggleFullScreenPreview} />
          ) : (
            <FullscreenOutlined onClick={toggleFullScreenPreview} />
          )}
        </div>
      ) : null}

      <div
        style={{ width, height, ...editorStyles }}
        ref={editorContainerRef}
      />
    </div>
  );
};
