import React, { Component } from "react";

export default (Element: any, errorCallback: (p: any) => any) => {
  return class ErrorBoundary extends Component {
    componentDidCatch(error: any) {
      errorCallback(error);
    }

    render() {
      return typeof Element === "function" ? (
        <Element />
      ) : React.isValidElement(Element) ? (
        Element
      ) : null;
    }
  };
};
