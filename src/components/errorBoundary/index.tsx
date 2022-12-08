import React, { Component } from "react";
export default class ErrorBoundary extends Component<any, any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // 你同样可以将错误日志上报给服务器
    // console.log("errorBoundary", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI 并渲染
      return <div>{this.state.error.message}</div>;
    }

    return this.props.children;
  }
}
