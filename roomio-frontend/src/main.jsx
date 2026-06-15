/**
 * Application entry point.
 *
 * Renders the React app inside a BrowserRouter and ChakraProvider
 * using the custom dark theme defined in config/theme.
 *
 * @module main
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import {BrowserRouter} from "react-router-dom";
import {ChakraProvider} from '@chakra-ui/react'
import { system } from "./config/theme";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <BrowserRouter>
            <ChakraProvider value={system}>

                <App/>
            </ChakraProvider>

        </BrowserRouter>
    </React.StrictMode>
);