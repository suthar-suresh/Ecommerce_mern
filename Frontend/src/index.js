import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import Context from "./Context/Context";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Context>
    <App />
  </Context>
);

serviceWorkerRegistration.register();
