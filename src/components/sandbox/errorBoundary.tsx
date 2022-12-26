import React, { Component } from "react";

export default class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: any) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { error };
  }

  static getDerivedStateFromProps(nextProps: any, state: any) {
    const newState = { ...state };
    newState.error = nextProps.error;
    return newState;
  }

  componentDidCatch(error: any, errorInfo: any) {
    // // 可以将错误日志上报给服务器
    // console.log("error did catch", error, errorInfo);
  }

  onError = (error: any) => {
    typeof this.props.onError === "function" && this.props.onError(error);
  };

  render() {
    const { error } = this.state;
    if (error) {
      // 你可以自定义降级后的 UI 并渲染
      return <div>{(error && error.message) || "未知错误！"}</div>;
    }

    return this.props.children;
  }
}
