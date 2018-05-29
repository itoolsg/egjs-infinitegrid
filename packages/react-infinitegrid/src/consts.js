export const DONE = 0;
export const APPEND = 1;
export const PREPEND = 2;
export const PROCESS = 4;

export const LOADED = 2;
export const LOADING = 1;
export const NOT_LOADED = 0;
export const NOT_RENDER = 0;
export const REQUEST_RENDER = 1;
export const RENDERED = 2;
export const LAYOUT_ID = "__REACT_LAYOUT_DATA_ID__";
export const CHECK_ALL = 1;
export const CHECK_ONLY_ERROR = 2;
export const DUMMY_POSITION = -99999;
export const SUPPORT_COMPUTEDSTYLE = !!("getComputedStyle" in window);