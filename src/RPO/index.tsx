// // index.tsx
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './App.css';

// import "ag-grid-community/styles/ag-grid.css";
// import "ag-grid-community/styles/ag-theme-quartz.css";
// import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";
// import { PublicClientApplication, EventType, AuthenticationResult } from "@azure/msal-browser";
// import { MsalProvider } from "@azure/msal-react";
// import { msalConfig } from "./authConfig";

// ModuleRegistry.registerModules([AllCommunityModule]);

// const msalInstance = new PublicClientApplication(msalConfig);

// if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
//   msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
// }

// msalInstance.addEventCallback((event) => {
//   if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
//     const payload = event.payload as AuthenticationResult;
//     const account = payload.account;
//     msalInstance.setActiveAccount(account);
//   }
// });

// const rootElement = document.getElementById('root');
// if (!rootElement) {
//   throw new Error("Could not find root element to mount to");
// }

// const root = ReactDOM.createRoot(rootElement);

// // Need to initialize msalInstance before rendering? 
// // initialize() is async in v3, but in react-msal, usually the provider handles it or we do it here.
// // For msal-browser v3+, we must call initialize().
// msalInstance.initialize().then(() => {
//   root.render(
//     <React.StrictMode>
//       <MsalProvider instance={msalInstance}>
//         <App />
//       </MsalProvider>
//     </React.StrictMode>
//   );
// });


// index.tsx - Clean version for backend OAuth
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ModuleRegistry, AllCommunityModule } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);