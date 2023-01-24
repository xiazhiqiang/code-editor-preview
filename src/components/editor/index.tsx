import {
  cdnPrefix,
  defaultCompCss,
  defaultCompJsx,
  editorSaveCssKey,
  editorSaveJsxKey,
} from "@/constants/index";
import loader from "@monaco-editor/loader";
import { message, Spin, Tag } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import storage from "store2";
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

const files = [
  {
    path: "/index.jsx",
    storeKey: editorSaveJsxKey,
    value: defaultCompJsx,
    isEntry: true,
  },
  {
    path: "/index.css",
    storeKey: editorSaveCssKey,
    value: defaultCompCss,
    isCss: true,
  },
];

const getCodes = () => {
  return files.map((file) => {
    let { value = "", isEntry, storeKey } = file || {};

    // 从localStorage中取值，如果没有则展示默认的组件代码
    value = storage.local.get(storeKey) || value || "";
    if (isEntry && !value) {
      value = defaultCompJsx;
    }

    return {
      ...file,
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

        editor.onDidChangeModelContent(() => {
          modifyFile({ path: filePathRef.current, state: true });
        });

        // 初始化editor models
        files.forEach((file: any) =>
          monaco.editor.createModel(
            file.value,
            /css$/.test(file.path) ? "css" : "javascript",
            new monaco.Uri().with({ path: file.path })
          )
        );

        // 获取入口文件路径
        const { path: entryFilePath = "" } =
          files.find((i: any) => i && i.isEntry) || {};
        setFilePath(entryFilePath);
        openFile({ editor, monaco, path: entryFilePath });

        // 初始触发更新
        onCodesSave(getCodes());
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
      setTimeout(() => {
        const v = editor.getValue();
        saveFile({ v, path: filePath });
      }, 100);
    });
  }, [editor, monaco, filePath]);

  // useEffect(() => {
  //   const observer = new ResizeObserver(() => {
  //     setTimeout(() => editor && editor.layout(), 0);
  //   });
  //   observer.observe(editorContainerRef.current);

  //   return () => {
  //     observer.disconnect();
  //   };
  // }, [editor]);

  const modifyFile = ({ path = "", state = false } = {}) => {
    const newFilesModifyState: any = { ...filesModifyStateRef.current };
    newFilesModifyState[path] = state;
    setFilesModifyState(newFilesModifyState);
  };

  const saveFile = ({ v = "", path = "" }) => {
    if (/css$/.test(path)) {
      storage.local.set(editorSaveCssKey, v, true);
    }
    if (/jsx?$/.test(path)) {
      storage.local.set(editorSaveJsxKey, v, true);
    }

    // 清空修改状态
    modifyFile({ path, state: false });

    // 获取所有文件最新的值，传递给外部
    const codes = getCodes();
    onCodesSave(codes);
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
        <div>
          {files.map((file: any = {}) => {
            return (
              <Tag
                color={
                  filePath === file.path ? "rgb(41,44,51)" : "rgb(34,37,42)"
                }
                className={`file-tag ${
                  filePath === file.path ? "file-tag--focus" : ""
                } ${
                  filesModifyStateRef.current[file.path]
                    ? "file-tag--modify"
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
      ) : null}

      <div
        style={{ width, height, ...editorStyles }}
        ref={editorContainerRef}
      />
    </div>
  );
};
