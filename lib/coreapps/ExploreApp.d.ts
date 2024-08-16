/// <reference types="dreamland" />
declare class ExploreApp extends App {
    hidden: boolean;
    constructor();
    css: string;
    welcome: JSX.Element;
    state: Stateful<{
        screen?: HTMLElement;
    }>;
    page: () => Promise<JSX.Element>;
    open(args?: string[]): Promise<WMWindow | undefined>;
}
