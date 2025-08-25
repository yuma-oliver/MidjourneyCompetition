import { createContext, useState } from "react";

export const PageContext = createContext();

const PageProvider = ({ children }) => {
    const [ selectedPage, setSelectedPage ] = useState("firstpage");

    return (
        <PageContext.Provider value={{ selectedPage, setSelectedPage }}>
            {children}
        </PageContext.Provider>
    );
};

export default PageProvider;