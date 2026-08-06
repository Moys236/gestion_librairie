globalThis.monorepoPackagePath = "";globalThis.openNextDebug = false;globalThis.openNextVersion = "4.0.2";globalThis.nextVersion = "16.2.10";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod3) => function __require2() {
  return mod3 || (0, cb[__getOwnPropNames(cb)[0]])((mod3 = { exports: {} }).exports, mod3), mod3.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod3, secondTarget) => (__copyProps(target, mod3, "default"), secondTarget && __copyProps(secondTarget, mod3, "default"));
var __toESM = (mod3, isNodeMode, target) => (target = mod3 != null ? __create(__getProtoOf(mod3)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod3 || !mod3.__esModule ? __defProp(target, "default", { value: mod3, enumerable: true }) : target,
  mod3
));
var __toCommonJS = (mod3) => __copyProps(__defProp({}, "__esModule", { value: true }), mod3);

// node_modules/@opennextjs/aws/dist/utils/error.js
function isOpenNextError(e) {
  try {
    return "__openNextInternal" in e;
  } catch {
    return false;
  }
}
var IgnorableError, FatalError;
var init_error = __esm({
  "node_modules/@opennextjs/aws/dist/utils/error.js"() {
    IgnorableError = class extends Error {
      __openNextInternal = true;
      canIgnore = true;
      logLevel = 0;
      constructor(message) {
        super(message);
        this.name = "IgnorableError";
      }
    };
    FatalError = class extends Error {
      __openNextInternal = true;
      canIgnore = false;
      logLevel = 2;
      constructor(message) {
        super(message);
        this.name = "FatalError";
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/adapters/logger.js
function debug(...args) {
  if (globalThis.openNextDebug) {
    console.log(...args);
  }
}
function warn(...args) {
  console.warn(...args);
}
function error(...args) {
  if (args.some((arg) => isDownplayedErrorLog(arg))) {
    return debug(...args);
  }
  if (args.some((arg) => isOpenNextError(arg))) {
    const error2 = args.find((arg) => isOpenNextError(arg));
    if (error2.logLevel < getOpenNextErrorLogLevel()) {
      return;
    }
    if (error2.logLevel === 0) {
      return console.log(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    if (error2.logLevel === 1) {
      return warn(...args.map((arg) => isOpenNextError(arg) ? `${arg.name}: ${arg.message}` : arg));
    }
    return console.error(...args);
  }
  console.error(...args);
}
function getOpenNextErrorLogLevel() {
  const strLevel = process.env.OPEN_NEXT_ERROR_LOG_LEVEL ?? "1";
  switch (strLevel.toLowerCase()) {
    case "debug":
    case "0":
      return 0;
    case "error":
    case "2":
      return 2;
    default:
      return 1;
  }
}
var DOWNPLAYED_ERROR_LOGS, isDownplayedErrorLog;
var init_logger = __esm({
  "node_modules/@opennextjs/aws/dist/adapters/logger.js"() {
    init_error();
    DOWNPLAYED_ERROR_LOGS = [
      {
        clientName: "S3Client",
        commandName: "GetObjectCommand",
        errorName: "NoSuchKey"
      }
    ];
    isDownplayedErrorLog = (errorLog) => DOWNPLAYED_ERROR_LOGS.some((downplayedInput) => downplayedInput.clientName === errorLog?.clientName && downplayedInput.commandName === errorLog?.commandName && (downplayedInput.errorName === errorLog?.error?.name || downplayedInput.errorName === errorLog?.error?.Code));
  }
});

// node_modules/@opennextjs/aws/dist/http/util.js
function parseSetCookieHeader(cookies) {
  if (!cookies) {
    return [];
  }
  if (typeof cookies === "string") {
    return cookies.split(/(?<!Expires=\w+),/i).map((c) => c.trim());
  }
  return cookies;
}
function getQueryFromIterator(it) {
  const query = {};
  for (const [key, value] of it) {
    if (key in query) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  }
  return query;
}
var parseHeaders, convertHeader;
var init_util = __esm({
  "node_modules/@opennextjs/aws/dist/http/util.js"() {
    init_logger();
    parseHeaders = (headers) => {
      const result = {};
      if (!headers) {
        return result;
      }
      for (const [key, value] of Object.entries(headers)) {
        if (value === void 0) {
          continue;
        }
        const keyLower = key.toLowerCase();
        if (keyLower === "location" && Array.isArray(value)) {
          if (value.length === 1 || value[0] === value[1]) {
            result[keyLower] = value[0];
          } else {
            warn("Multiple different values for Location header found. Using the last one");
            result[keyLower] = value[value.length - 1];
          }
          continue;
        }
        result[keyLower] = convertHeader(value);
      }
      return result;
    };
    convertHeader = (header) => {
      if (typeof header === "string") {
        return header;
      }
      if (Array.isArray(header)) {
        return header.join(",");
      }
      return String(header);
    };
  }
});

// node-built-in-modules:node:module
var node_module_exports = {};
import * as node_module_star from "node:module";
var init_node_module = __esm({
  "node-built-in-modules:node:module"() {
    __reExport(node_module_exports, node_module_star);
  }
});

// node_modules/@opennextjs/aws/dist/utils/stream.js
import { ReadableStream as ReadableStream2 } from "node:stream/web";
function emptyReadableStream() {
  if (process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
    return new ReadableStream2({
      pull(controller) {
        maybeSomethingBuffer ??= Buffer.from("SOMETHING");
        controller.enqueue(maybeSomethingBuffer);
        controller.close();
      }
    }, { highWaterMark: 0 });
  }
  return new ReadableStream2({
    start(controller) {
      controller.close();
    }
  });
}
var maybeSomethingBuffer;
var init_stream = __esm({
  "node_modules/@opennextjs/aws/dist/utils/stream.js"() {
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/utils.js
function getQueryFromSearchParams(searchParams) {
  return getQueryFromIterator(searchParams.entries());
}
var init_utils = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/utils.js"() {
    init_util();
  }
});

// node_modules/cookie/dist/index.js
var require_dist = __commonJS({
  "node_modules/cookie/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.parseCookie = parseCookie;
    exports.parse = parseCookie;
    exports.stringifyCookie = stringifyCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    exports.parseSetCookie = parseSetCookie;
    exports.stringifySetCookie = stringifySetCookie;
    exports.serialize = stringifySetCookie;
    var cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
    var cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
    var domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
    var pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
    var maxAgeRegExp = /^-?\d+$/;
    var __toString = Object.prototype.toString;
    var NullObject = /* @__PURE__ */ (() => {
      const C = function() {
      };
      C.prototype = /* @__PURE__ */ Object.create(null);
      return C;
    })();
    function parseCookie(str, options) {
      const obj = new NullObject();
      const len = str.length;
      if (len < 2)
        return obj;
      const dec = options?.decode || decode;
      let index = 0;
      do {
        const eqIdx = eqIndex(str, index, len);
        if (eqIdx === -1)
          break;
        const endIdx = endIndex(str, index, len);
        if (eqIdx > endIdx) {
          index = str.lastIndexOf(";", eqIdx - 1) + 1;
          continue;
        }
        const key = valueSlice(str, index, eqIdx);
        if (obj[key] === void 0) {
          obj[key] = dec(valueSlice(str, eqIdx + 1, endIdx));
        }
        index = endIdx + 1;
      } while (index < len);
      return obj;
    }
    function stringifyCookie(cookie, options) {
      const enc = options?.encode || encodeURIComponent;
      const cookieStrings = [];
      for (const name of Object.keys(cookie)) {
        const val = cookie[name];
        if (val === void 0)
          continue;
        if (!cookieNameRegExp.test(name)) {
          throw new TypeError(`cookie name is invalid: ${name}`);
        }
        const value = enc(val);
        if (!cookieValueRegExp.test(value)) {
          throw new TypeError(`cookie val is invalid: ${val}`);
        }
        cookieStrings.push(`${name}=${value}`);
      }
      return cookieStrings.join("; ");
    }
    function stringifySetCookie(_name, _val, _opts) {
      const cookie = typeof _name === "object" ? _name : { ..._opts, name: _name, value: String(_val) };
      const options = typeof _val === "object" ? _val : _opts;
      const enc = options?.encode || encodeURIComponent;
      if (!cookieNameRegExp.test(cookie.name)) {
        throw new TypeError(`argument name is invalid: ${cookie.name}`);
      }
      const value = cookie.value ? enc(cookie.value) : "";
      if (!cookieValueRegExp.test(value)) {
        throw new TypeError(`argument val is invalid: ${cookie.value}`);
      }
      let str = cookie.name + "=" + value;
      if (cookie.maxAge !== void 0) {
        if (!Number.isInteger(cookie.maxAge)) {
          throw new TypeError(`option maxAge is invalid: ${cookie.maxAge}`);
        }
        str += "; Max-Age=" + cookie.maxAge;
      }
      if (cookie.domain) {
        if (!domainValueRegExp.test(cookie.domain)) {
          throw new TypeError(`option domain is invalid: ${cookie.domain}`);
        }
        str += "; Domain=" + cookie.domain;
      }
      if (cookie.path) {
        if (!pathValueRegExp.test(cookie.path)) {
          throw new TypeError(`option path is invalid: ${cookie.path}`);
        }
        str += "; Path=" + cookie.path;
      }
      if (cookie.expires) {
        if (!isDate(cookie.expires) || !Number.isFinite(cookie.expires.valueOf())) {
          throw new TypeError(`option expires is invalid: ${cookie.expires}`);
        }
        str += "; Expires=" + cookie.expires.toUTCString();
      }
      if (cookie.httpOnly) {
        str += "; HttpOnly";
      }
      if (cookie.secure) {
        str += "; Secure";
      }
      if (cookie.partitioned) {
        str += "; Partitioned";
      }
      if (cookie.priority) {
        const priority = typeof cookie.priority === "string" ? cookie.priority.toLowerCase() : void 0;
        switch (priority) {
          case "low":
            str += "; Priority=Low";
            break;
          case "medium":
            str += "; Priority=Medium";
            break;
          case "high":
            str += "; Priority=High";
            break;
          default:
            throw new TypeError(`option priority is invalid: ${cookie.priority}`);
        }
      }
      if (cookie.sameSite) {
        const sameSite = typeof cookie.sameSite === "string" ? cookie.sameSite.toLowerCase() : cookie.sameSite;
        switch (sameSite) {
          case true:
          case "strict":
            str += "; SameSite=Strict";
            break;
          case "lax":
            str += "; SameSite=Lax";
            break;
          case "none":
            str += "; SameSite=None";
            break;
          default:
            throw new TypeError(`option sameSite is invalid: ${cookie.sameSite}`);
        }
      }
      return str;
    }
    function parseSetCookie(str, options) {
      const dec = options?.decode || decode;
      const len = str.length;
      const endIdx = endIndex(str, 0, len);
      const eqIdx = eqIndex(str, 0, endIdx);
      const setCookie = eqIdx === -1 ? { name: "", value: dec(valueSlice(str, 0, endIdx)) } : {
        name: valueSlice(str, 0, eqIdx),
        value: dec(valueSlice(str, eqIdx + 1, endIdx))
      };
      let index = endIdx + 1;
      while (index < len) {
        const endIdx2 = endIndex(str, index, len);
        const eqIdx2 = eqIndex(str, index, endIdx2);
        const attr = eqIdx2 === -1 ? valueSlice(str, index, endIdx2) : valueSlice(str, index, eqIdx2);
        const val = eqIdx2 === -1 ? void 0 : valueSlice(str, eqIdx2 + 1, endIdx2);
        switch (attr.toLowerCase()) {
          case "httponly":
            setCookie.httpOnly = true;
            break;
          case "secure":
            setCookie.secure = true;
            break;
          case "partitioned":
            setCookie.partitioned = true;
            break;
          case "domain":
            setCookie.domain = val;
            break;
          case "path":
            setCookie.path = val;
            break;
          case "max-age":
            if (val && maxAgeRegExp.test(val))
              setCookie.maxAge = Number(val);
            break;
          case "expires":
            if (!val)
              break;
            const date = new Date(val);
            if (Number.isFinite(date.valueOf()))
              setCookie.expires = date;
            break;
          case "priority":
            if (!val)
              break;
            const priority = val.toLowerCase();
            if (priority === "low" || priority === "medium" || priority === "high") {
              setCookie.priority = priority;
            }
            break;
          case "samesite":
            if (!val)
              break;
            const sameSite = val.toLowerCase();
            if (sameSite === "lax" || sameSite === "strict" || sameSite === "none") {
              setCookie.sameSite = sameSite;
            }
            break;
        }
        index = endIdx2 + 1;
      }
      return setCookie;
    }
    function endIndex(str, min, len) {
      const index = str.indexOf(";", min);
      return index === -1 ? len : index;
    }
    function eqIndex(str, min, max) {
      const index = str.indexOf("=", min);
      return index < max ? index : -1;
    }
    function valueSlice(str, min, max) {
      let start = min;
      let end = max;
      do {
        const code = str.charCodeAt(start);
        if (code !== 32 && code !== 9)
          break;
      } while (++start < end);
      while (end > start) {
        const code = str.charCodeAt(end - 1);
        if (code !== 32 && code !== 9)
          break;
        end--;
      }
      return str.slice(start, end);
    }
    function decode(str) {
      if (str.indexOf("%") === -1)
        return str;
      try {
        return decodeURIComponent(str);
      } catch (e) {
        return str;
      }
    }
    function isDate(val) {
      return __toString.call(val) === "[object Date]";
    }
  }
});

// node_modules/@opennextjs/aws/dist/overrides/converters/edge.js
var edge_exports = {};
__export(edge_exports, {
  default: () => edge_default
});
import { Buffer as Buffer2 } from "node:buffer";
var import_cookie, NULL_BODY_STATUSES, converter, edge_default;
var init_edge = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/converters/edge.js"() {
    import_cookie = __toESM(require_dist(), 1);
    init_util();
    init_utils();
    NULL_BODY_STATUSES = /* @__PURE__ */ new Set([101, 103, 204, 205, 304]);
    converter = {
      convertFrom: async (event) => {
        const url = new URL(event.url);
        const searchParams = url.searchParams;
        const query = getQueryFromSearchParams(searchParams);
        const headers = {};
        event.headers.forEach((value, key) => {
          headers[key] = value;
        });
        const rawPath = url.pathname;
        const method = event.method;
        const shouldHaveBody = method !== "GET" && method !== "HEAD";
        const body = shouldHaveBody ? Buffer2.from(await event.arrayBuffer()) : void 0;
        const cookieHeader = event.headers.get("cookie");
        const cookies = cookieHeader ? import_cookie.default.parse(cookieHeader) : {};
        return {
          type: "core",
          method,
          rawPath,
          url: event.url,
          body,
          headers,
          remoteAddress: event.headers.get("x-forwarded-for") ?? "::1",
          query,
          cookies
        };
      },
      convertTo: async (result) => {
        if ("internalEvent" in result) {
          const request = new Request(result.internalEvent.url, {
            body: result.internalEvent.body,
            method: result.internalEvent.method,
            headers: {
              ...result.internalEvent.headers,
              "x-forwarded-host": result.internalEvent.headers.host
            }
          });
          if (globalThis.__dangerous_ON_edge_converter_returns_request === true) {
            return request;
          }
          const cfCache = (result.isISR || result.internalEvent.rawPath.startsWith("/_next/image")) && process.env.DISABLE_CACHE !== "true" ? { cacheEverything: true } : {};
          return fetch(request, {
            // This is a hack to make sure that the response is cached by Cloudflare
            // See https://developers.cloudflare.com/workers/examples/cache-using-fetch/#caching-html-resources
            // @ts-expect-error - This is a Cloudflare specific option
            cf: cfCache
          });
        }
        const headers = new Headers();
        for (const [key, value] of Object.entries(result.headers)) {
          if (key === "set-cookie" && typeof value === "string") {
            const cookies = parseSetCookieHeader(value);
            for (const cookie of cookies) {
              headers.append(key, cookie);
            }
            continue;
          }
          if (Array.isArray(value)) {
            for (const v of value) {
              headers.append(key, v);
            }
          } else {
            headers.set(key, value);
          }
        }
        const body = NULL_BODY_STATUSES.has(result.statusCode) ? null : result.body;
        return new Response(body, {
          status: result.statusCode,
          headers
        });
      },
      name: "edge"
    };
    edge_default = converter;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js
var cloudflare_node_exports = {};
__export(cloudflare_node_exports, {
  default: () => cloudflare_node_default
});
import { Writable } from "node:stream";
var NULL_BODY_STATUSES2, handler, cloudflare_node_default;
var init_cloudflare_node = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/wrappers/cloudflare-node.js"() {
    NULL_BODY_STATUSES2 = /* @__PURE__ */ new Set([101, 204, 205, 304]);
    handler = async (handler3, converter2) => async (request, env, ctx, abortSignal) => {
      globalThis.process = process;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === "string") {
          process.env[key] = value;
        }
      }
      const internalEvent = await converter2.convertFrom(request);
      const url = new URL(request.url);
      const { promise: promiseResponse, resolve: resolveResponse } = Promise.withResolvers();
      const streamCreator = {
        writeHeaders(prelude) {
          const { statusCode, cookies, headers } = prelude;
          const responseHeaders = new Headers(headers);
          for (const cookie of cookies) {
            responseHeaders.append("Set-Cookie", cookie);
          }
          if (url.hostname === "localhost") {
            responseHeaders.set("Content-Encoding", "identity");
          }
          if (NULL_BODY_STATUSES2.has(statusCode)) {
            const response2 = new Response(null, {
              status: statusCode,
              headers: responseHeaders
            });
            resolveResponse(response2);
            return new Writable({
              write(chunk, encoding, callback) {
                callback();
              }
            });
          }
          let controller;
          const readable = new ReadableStream({
            start(c) {
              controller = c;
            }
          });
          const response = new Response(readable, {
            status: statusCode,
            headers: responseHeaders
          });
          resolveResponse(response);
          return new Writable({
            write(chunk, encoding, callback) {
              try {
                controller.enqueue(chunk);
              } catch (e) {
                return callback(e);
              }
              callback();
            },
            final(callback) {
              controller.close();
              callback();
            },
            destroy(error2, callback) {
              if (error2) {
                controller.error(error2);
              } else {
                try {
                  controller.close();
                } catch {
                }
              }
              callback(error2);
            }
          });
        },
        // This is for passing along the original abort signal from the initial Request you retrieve in your worker
        // Ensures that the response we pass to NextServer is aborted if the request is aborted
        // By doing this `request.signal.onabort` will work in route handlers
        abortSignal,
        // There is no need to retain the chunks that were pushed to the response stream.
        retainChunks: false
      };
      ctx.waitUntil(handler3(internalEvent, {
        streamCreator,
        waitUntil: ctx.waitUntil.bind(ctx)
      }));
      return promiseResponse;
    };
    cloudflare_node_default = {
      wrapper: handler,
      name: "cloudflare-node",
      supportStreaming: true
    };
  }
});

// node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js
var dummy_exports = {};
__export(dummy_exports, {
  default: () => dummy_default
});
var dummyTagCache, dummy_default;
var init_dummy = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/tagCache/dummy.js"() {
    dummyTagCache = {
      name: "dummy",
      mode: "original",
      getByPath: async () => {
        return [];
      },
      getByTag: async () => {
        return [];
      },
      getLastModified: async (_, lastModified) => {
        return lastModified ?? Date.now();
      },
      writeTags: async () => {
        return;
      },
      isStale: async (_path) => {
        return false;
      }
    };
    dummy_default = dummyTagCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js
var dummy_exports2 = {};
__export(dummy_exports2, {
  default: () => dummy_default2
});
var dummyQueue, dummy_default2;
var init_dummy2 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/queue/dummy.js"() {
    init_error();
    dummyQueue = {
      name: "dummy",
      send: async () => {
        throw new FatalError("Dummy queue is not implemented");
      }
    };
    dummy_default2 = dummyQueue;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js
var dummy_exports3 = {};
__export(dummy_exports3, {
  default: () => dummy_default3
});
var dummyIncrementalCache, dummy_default3;
var init_dummy3 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/incrementalCache/dummy.js"() {
    init_error();
    dummyIncrementalCache = {
      name: "dummy",
      get: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      set: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      },
      delete: async () => {
        throw new IgnorableError('"Dummy" cache does not cache anything');
      }
    };
    dummy_default3 = dummyIncrementalCache;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js
var dummy_exports4 = {};
__export(dummy_exports4, {
  default: () => dummy_default4
});
var resolver, dummy_default4;
var init_dummy4 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/assetResolver/dummy.js"() {
    resolver = {
      name: "dummy"
    };
    dummy_default4 = resolver;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js
var fetch_exports = {};
__export(fetch_exports, {
  default: () => fetch_default
});
var fetchProxy, fetch_default;
var init_fetch = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/proxyExternalRequest/fetch.js"() {
    init_stream();
    fetchProxy = {
      name: "fetch-proxy",
      // @ts-ignore
      proxy: async (internalEvent) => {
        const { url, headers: eventHeaders, method, body } = internalEvent;
        const headers = Object.fromEntries(Object.entries(eventHeaders).filter(([key]) => key.toLowerCase() !== "cf-connecting-ip"));
        const response = await fetch(url, {
          method,
          headers,
          body
        });
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          const cur = responseHeaders[key];
          if (cur === void 0) {
            responseHeaders[key] = value;
          } else if (Array.isArray(cur)) {
            cur.push(value);
          } else {
            responseHeaders[key] = [cur, value];
          }
        });
        return {
          type: "core",
          headers: responseHeaders,
          statusCode: response.status,
          isBase64Encoded: true,
          body: response.body ?? emptyReadableStream()
        };
      }
    };
    fetch_default = fetchProxy;
  }
});

// node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js
var dummy_exports5 = {};
__export(dummy_exports5, {
  default: () => dummy_default5
});
var dummy_default5;
var init_dummy5 = __esm({
  "node_modules/@opennextjs/aws/dist/overrides/cdnInvalidation/dummy.js"() {
    dummy_default5 = {
      name: "dummy",
      invalidatePaths: (_) => {
        return Promise.resolve();
      }
    };
  }
});

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/adapters/util.js
function setNodeEnv() {
  const processEnv = process.env;
  processEnv.NODE_ENV = process.env.NODE_ENV ?? "production";
}
function generateUniqueId() {
  return Math.random().toString(36).slice(2, 8);
}

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
import { AsyncLocalStorage } from "node:async_hooks";

// node_modules/@opennextjs/aws/dist/http/openNextResponse.js
init_logger();
init_util();
import { Transform } from "node:stream";
var SET_COOKIE_HEADER = "set-cookie";
var CANNOT_BE_USED = "This cannot be used in OpenNext";
var OpenNextNodeResponse = class extends Transform {
  fixHeadersFn;
  onEnd;
  streamCreator;
  initialHeaders;
  statusCode;
  statusMessage = "";
  headers = {};
  headersSent = false;
  _chunks = [];
  headersAlreadyFixed = false;
  _cookies = [];
  responseStream;
  bodyLength = 0;
  // To comply with the ServerResponse interface :
  strictContentLength = false;
  assignSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  detachSocket(_socket) {
    throw new Error(CANNOT_BE_USED);
  }
  // We might have to revisit those 3 in the future
  writeContinue(_callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeEarlyHints(_hints, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  writeProcessing() {
    throw new Error(CANNOT_BE_USED);
  }
  /**
   * This is a dummy request object to comply with the ServerResponse interface
   * It will never be defined
   */
  req;
  chunkedEncoding = false;
  shouldKeepAlive = true;
  useChunkedEncodingByDefault = true;
  sendDate = false;
  connection = null;
  socket = null;
  setTimeout(_msecs, _callback) {
    throw new Error(CANNOT_BE_USED);
  }
  addTrailers(_headers) {
    throw new Error(CANNOT_BE_USED);
  }
  constructor(fixHeadersFn, onEnd, streamCreator, initialHeaders, statusCode) {
    super();
    this.fixHeadersFn = fixHeadersFn;
    this.onEnd = onEnd;
    this.streamCreator = streamCreator;
    this.initialHeaders = initialHeaders;
    if (statusCode && Number.isInteger(statusCode) && statusCode >= 100 && statusCode <= 599) {
      this.statusCode = statusCode;
    }
    streamCreator?.abortSignal?.addEventListener("abort", () => {
      this.destroy();
    });
  }
  // Necessary for next 12
  // We might have to implement all the methods here
  get originalResponse() {
    return this;
  }
  get finished() {
    return this.responseStream ? this.responseStream?.writableFinished : this.writableFinished;
  }
  setHeader(name, value) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      if (Array.isArray(value)) {
        this._cookies = value;
      } else {
        this._cookies = [value];
      }
    }
    this.headers[key] = value;
    return this;
  }
  removeHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      this._cookies = [];
    } else {
      delete this.headers[key];
    }
    return this;
  }
  hasHeader(name) {
    const key = name.toLowerCase();
    if (key === SET_COOKIE_HEADER) {
      return this._cookies.length > 0;
    }
    return this.headers[key] !== void 0;
  }
  getHeaders() {
    return this.headers;
  }
  getHeader(name) {
    return this.headers[name.toLowerCase()];
  }
  getHeaderNames() {
    return Object.keys(this.headers);
  }
  // Only used directly in next@14+
  flushHeaders() {
    this.headersSent = true;
    const mergeHeadersPriority = globalThis.__openNextAls?.getStore()?.mergeHeadersPriority ?? "middleware";
    if (this.initialHeaders) {
      this.headers = mergeHeadersPriority === "middleware" ? {
        ...this.headers,
        ...this.initialHeaders
      } : {
        ...this.initialHeaders,
        ...this.headers
      };
      const initialCookies = parseSetCookieHeader(this.initialHeaders[SET_COOKIE_HEADER]?.toString());
      this._cookies = mergeHeadersPriority === "middleware" ? [...this._cookies, ...initialCookies] : [...initialCookies, ...this._cookies];
    }
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    const parsedHeaders = parseHeaders(this.headers);
    delete parsedHeaders[SET_COOKIE_HEADER];
    if (this.streamCreator) {
      this.responseStream = this.streamCreator?.writeHeaders({
        statusCode: this.statusCode ?? 200,
        cookies: this._cookies,
        headers: parsedHeaders
      });
      this.pipe(this.responseStream);
    }
  }
  appendHeader(name, value) {
    const key = name.toLowerCase();
    if (!this.hasHeader(key)) {
      return this.setHeader(key, value);
    }
    const existingHeader = this.getHeader(key);
    const toAppend = Array.isArray(value) ? value : [value];
    const newValue = Array.isArray(existingHeader) ? [...existingHeader, ...toAppend] : [existingHeader, ...toAppend];
    return this.setHeader(key, newValue);
  }
  writeHead(statusCode, statusMessage, headers) {
    let _headers = headers;
    let _statusMessage;
    if (typeof statusMessage === "string") {
      _statusMessage = statusMessage;
    } else {
      _headers = statusMessage;
    }
    const finalHeaders = this.headers;
    if (_headers) {
      if (Array.isArray(_headers)) {
        for (let i = 0; i < _headers.length; i += 2) {
          finalHeaders[_headers[i]] = _headers[i + 1];
        }
      } else {
        for (const key of Object.keys(_headers)) {
          finalHeaders[key] = _headers[key];
        }
      }
    }
    this.statusCode = statusCode;
    if (headers) {
      this.headers = finalHeaders;
    }
    this.flushHeaders();
    return this;
  }
  /**
   * OpenNext specific method
   */
  fixHeaders(headers) {
    if (this.headersAlreadyFixed) {
      return;
    }
    this.fixHeadersFn(headers);
    this.headersAlreadyFixed = true;
  }
  getFixedHeaders() {
    this.fixHeaders(this.headers);
    this.fixHeadersForError();
    this.headers[SET_COOKIE_HEADER] = this._cookies;
    return this.headers;
  }
  getBody() {
    return Buffer.concat(this._chunks);
  }
  _internalWrite(chunk, encoding) {
    const buffer = encoding === "buffer" ? chunk : Buffer.from(chunk, encoding);
    this.bodyLength += buffer.length;
    if (this.streamCreator?.retainChunks !== false) {
      this._chunks.push(buffer);
    }
    this.push(buffer);
    this.streamCreator?.onWrite?.();
  }
  _transform(chunk, encoding, callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    this._internalWrite(chunk, encoding);
    callback();
  }
  _flush(callback) {
    if (!this.headersSent) {
      this.flushHeaders();
    }
    globalThis.__openNextAls?.getStore()?.pendingPromiseRunner.add(this.onEnd(this.headers));
    this.streamCreator?.onFinish?.(this.bodyLength);
    if (this.bodyLength === 0 && // We use an env variable here because not all aws account have the same behavior
    // On some aws accounts the response will hang if the body is empty
    // We are modifying the response body here, this is not a good practice
    process.env.OPEN_NEXT_FORCE_NON_EMPTY_RESPONSE === "true") {
      debug('Force writing "SOMETHING" to the response body');
      this.push("SOMETHING");
    }
    callback();
  }
  /**
   * New method in Node 18.15+
   * There are probably not used right now in Next.js, but better be safe than sorry
   */
  setHeaders(headers) {
    headers.forEach((value, key) => {
      this.setHeader(key, Array.isArray(value) ? value : value.toString());
    });
    return this;
  }
  /**
   * Next specific methods
   * On earlier versions of next.js, those methods are mandatory to make everything work
   */
  get sent() {
    return this.finished || this.headersSent;
  }
  getHeaderValues(name) {
    const values = this.getHeader(name);
    if (values === void 0)
      return void 0;
    return (Array.isArray(values) ? values : [values]).map((value) => value.toString());
  }
  send() {
    for (const chunk of this._chunks) {
      this.write(chunk);
    }
    this.end();
  }
  body(value) {
    this.write(value);
    return this;
  }
  onClose(callback) {
    this.on("close", callback);
  }
  redirect(destination, statusCode) {
    this.setHeader("Location", destination);
    this.statusCode = statusCode;
    if (statusCode === 308) {
      this.setHeader("Refresh", `0;url=${destination}`);
    }
    return this;
  }
  // For some reason, next returns the 500 error page with some cache-control headers
  // We need to fix that
  fixHeadersForError() {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    if (this.statusCode === 404 || this.statusCode === 500) {
      this.headers["cache-control"] = "private, no-cache, no-store, max-age=0, must-revalidate";
    }
  }
};

// node_modules/@opennextjs/aws/dist/http/request.js
import http from "node:http";
var IncomingMessage = class extends http.IncomingMessage {
  constructor({ method, url, headers, body, remoteAddress }) {
    super({
      encrypted: true,
      readable: false,
      remoteAddress,
      address: () => ({ port: 443 }),
      end: Function.prototype,
      destroy: Function.prototype
    });
    if (body) {
      headers["content-length"] ??= String(Buffer.byteLength(body));
    }
    Object.assign(this, {
      ip: remoteAddress,
      complete: true,
      httpVersion: "1.1",
      httpVersionMajor: "1",
      httpVersionMinor: "1",
      method,
      headers,
      body,
      url
    });
    this._read = () => {
      this.push(body);
      this.push(null);
    };
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
init_logger();

// node_modules/@opennextjs/aws/dist/utils/requestCache.js
var RequestCache = class {
  _caches = /* @__PURE__ */ new Map();
  /**
   * Returns the Map registered under `key`.
   * If no Map exists yet for that key, a new empty Map is created, stored, and returned.
   * Repeated calls with the same key always return the **same** Map instance.
   */
  getOrCreate(key) {
    let cache = this._caches.get(key);
    if (!cache) {
      cache = /* @__PURE__ */ new Map();
      this._caches.set(key, cache);
    }
    return cache;
  }
};

// node_modules/@opennextjs/aws/dist/utils/promise.js
var DetachedPromise = class {
  resolve;
  reject;
  promise;
  constructor() {
    let resolve;
    let reject;
    this.promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
};
var DetachedPromiseRunner = class {
  promises = [];
  withResolvers() {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    return detachedPromise;
  }
  add(promise) {
    const detachedPromise = new DetachedPromise();
    this.promises.push(detachedPromise);
    promise.then(detachedPromise.resolve, detachedPromise.reject);
  }
  async await() {
    debug(`Awaiting ${this.promises.length} detached promises`);
    const results = await Promise.allSettled(this.promises.map((p) => p.promise));
    const rejectedPromises = results.filter((r) => r.status === "rejected");
    rejectedPromises.forEach((r) => {
      error(r.reason);
    });
  }
};
async function awaitAllDetachedPromise() {
  const store = globalThis.__openNextAls.getStore();
  const promisesToAwait = store?.pendingPromiseRunner.await() ?? Promise.resolve();
  if (store?.waitUntil) {
    store.waitUntil(promisesToAwait);
    return;
  }
  await promisesToAwait;
}
function provideNextAfterProvider() {
  const NEXT_REQUEST_CONTEXT_SYMBOL = Symbol.for("@next/request-context");
  const VERCEL_REQUEST_CONTEXT_SYMBOL = Symbol.for("@vercel/request-context");
  const store = globalThis.__openNextAls.getStore();
  const waitUntil = store?.waitUntil ?? ((promise) => store?.pendingPromiseRunner.add(promise));
  const nextAfterContext = {
    get: () => ({
      waitUntil
    })
  };
  globalThis[NEXT_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  if (process.env.EMULATE_VERCEL_REQUEST_CONTEXT) {
    globalThis[VERCEL_REQUEST_CONTEXT_SYMBOL] = nextAfterContext;
  }
}
function runWithOpenNextRequestContext({ isISRRevalidation, waitUntil, requestId = Math.random().toString(36) }, fn) {
  return globalThis.__openNextAls.run({
    requestId,
    pendingPromiseRunner: new DetachedPromiseRunner(),
    isISRRevalidation,
    waitUntil,
    writtenTags: /* @__PURE__ */ new Set(),
    requestCache: new RequestCache()
  }, async () => {
    provideNextAfterProvider();
    let result;
    try {
      result = await fn();
    } finally {
      await awaitAllDetachedPromise();
    }
    return result;
  });
}

// node_modules/@opennextjs/aws/dist/adapters/config/index.js
init_logger();
import path from "node:path";
globalThis.__dirname ??= "";
var NEXT_DIR = path.join(__dirname, ".next");
var OPEN_NEXT_DIR = path.join(__dirname, ".open-next");
debug({ NEXT_DIR, OPEN_NEXT_DIR });
var NextConfig = { "env": {}, "webpack": null, "typescript": { "ignoreBuildErrors": false }, "typedRoutes": false, "distDir": ".next", "cleanDistDir": true, "assetPrefix": "", "cacheMaxMemorySize": 52428800, "configOrigin": "next.config.ts", "useFileSystemPublicRoutes": true, "generateEtags": true, "pageExtensions": ["tsx", "ts", "jsx", "js"], "poweredByHeader": true, "compress": true, "images": { "deviceSizes": [640, 750, 828, 1080, 1200, 1920, 2048, 3840], "imageSizes": [32, 48, 64, 96, 128, 256, 384], "path": "/_next/image", "loader": "default", "loaderFile": "", "domains": [], "disableStaticImages": false, "minimumCacheTTL": 14400, "formats": ["image/webp"], "maximumRedirects": 3, "maximumResponseBody": 5e7, "dangerouslyAllowLocalIP": false, "dangerouslyAllowSVG": false, "contentSecurityPolicy": "script-src 'none'; frame-src 'none'; sandbox;", "contentDispositionType": "attachment", "localPatterns": [{ "pathname": "**", "search": "" }], "remotePatterns": [], "qualities": [75], "unoptimized": false, "customCacheHandler": false }, "devIndicators": { "position": "bottom-left" }, "onDemandEntries": { "maxInactiveAge": 6e4, "pagesBufferLength": 5 }, "basePath": "", "sassOptions": {}, "trailingSlash": false, "i18n": null, "productionBrowserSourceMaps": false, "excludeDefaultMomentLocales": true, "reactProductionProfiling": false, "reactStrictMode": null, "reactMaxHeadersLength": 6e3, "httpAgentOptions": { "keepAlive": true }, "logging": { "serverFunctions": true, "browserToTerminal": "warn" }, "compiler": {}, "expireTime": 31536e3, "staticPageGenerationTimeout": 60, "output": "standalone", "modularizeImports": { "@mui/icons-material": { "transform": "@mui/icons-material/{{member}}" }, "lodash": { "transform": "lodash/{{member}}" } }, "outputFileTracingRoot": "C:\\Users\\HP\\Desktop\\IbnRochd\\next", "cacheComponents": false, "cacheLife": { "default": { "stale": 300, "revalidate": 900, "expire": 4294967294 }, "seconds": { "stale": 30, "revalidate": 1, "expire": 60 }, "minutes": { "stale": 300, "revalidate": 60, "expire": 3600 }, "hours": { "stale": 300, "revalidate": 3600, "expire": 86400 }, "days": { "stale": 300, "revalidate": 86400, "expire": 604800 }, "weeks": { "stale": 300, "revalidate": 604800, "expire": 2592e3 }, "max": { "stale": 300, "revalidate": 2592e3, "expire": 31536e3 } }, "cacheHandlers": {}, "experimental": { "appNewScrollHandler": false, "useSkewCookie": false, "cssChunking": true, "multiZoneDraftMode": false, "appNavFailHandling": false, "prerenderEarlyExit": true, "serverMinification": true, "linkNoTouchStart": false, "caseSensitiveRoutes": false, "cachedNavigations": false, "partialFallbacks": false, "dynamicOnHover": false, "varyParams": false, "prefetchInlining": false, "preloadEntriesOnStart": true, "clientRouterFilter": true, "clientRouterFilterRedirects": false, "fetchCacheKeyPrefix": "", "proxyPrefetch": "flexible", "optimisticClientCache": true, "manualClientBasePath": false, "cpus": 7, "memoryBasedWorkersCount": false, "imgOptConcurrency": null, "imgOptTimeoutInSeconds": 7, "imgOptMaxInputPixels": 268402689, "imgOptSequentialRead": null, "imgOptSkipMetadata": null, "isrFlushToDisk": true, "workerThreads": false, "optimizeCss": false, "nextScriptWorkers": false, "scrollRestoration": false, "externalDir": false, "disableOptimizedLoading": false, "gzipSize": true, "craCompat": false, "esmExternals": true, "fullySpecified": false, "swcTraceProfiling": false, "forceSwcTransforms": false, "largePageDataBytes": 128e3, "typedEnv": false, "parallelServerCompiles": false, "parallelServerBuildTraces": false, "ppr": false, "authInterrupts": false, "webpackMemoryOptimizations": false, "optimizeServerReact": true, "strictRouteTypes": false, "viewTransition": false, "removeUncaughtErrorAndRejectionListeners": false, "validateRSCRequestHeaders": false, "staleTimes": { "dynamic": 0, "static": 300 }, "reactDebugChannel": true, "serverComponentsHmrCache": true, "staticGenerationMaxConcurrency": 8, "staticGenerationMinPagesPerWorker": 25, "transitionIndicator": false, "gestureTransition": false, "inlineCss": false, "useCache": false, "globalNotFound": false, "browserDebugInfoInTerminal": "warn", "lockDistDir": true, "proxyClientMaxBodySize": 10485760, "hideLogsAfterAbort": false, "mcpServer": true, "turbopackFileSystemCacheForDev": true, "turbopackFileSystemCacheForBuild": false, "turbopackInferModuleSideEffects": true, "turbopackPluginRuntimeStrategy": "childProcesses", "optimizePackageImports": ["lucide-react", "date-fns", "lodash-es", "ramda", "antd", "react-bootstrap", "ahooks", "@ant-design/icons", "@headlessui/react", "@headlessui-float/react", "@heroicons/react/20/solid", "@heroicons/react/24/solid", "@heroicons/react/24/outline", "@visx/visx", "@tremor/react", "rxjs", "@mui/material", "@mui/icons-material", "recharts", "react-use", "effect", "@effect/schema", "@effect/platform", "@effect/platform-node", "@effect/platform-browser", "@effect/platform-bun", "@effect/sql", "@effect/sql-mssql", "@effect/sql-mysql2", "@effect/sql-pg", "@effect/sql-sqlite-node", "@effect/sql-sqlite-bun", "@effect/sql-sqlite-wasm", "@effect/sql-sqlite-react-native", "@effect/rpc", "@effect/rpc-http", "@effect/typeclass", "@effect/experimental", "@effect/opentelemetry", "@material-ui/core", "@material-ui/icons", "@tabler/icons-react", "mui-core", "react-icons/ai", "react-icons/bi", "react-icons/bs", "react-icons/cg", "react-icons/ci", "react-icons/di", "react-icons/fa", "react-icons/fa6", "react-icons/fc", "react-icons/fi", "react-icons/gi", "react-icons/go", "react-icons/gr", "react-icons/hi", "react-icons/hi2", "react-icons/im", "react-icons/io", "react-icons/io5", "react-icons/lia", "react-icons/lib", "react-icons/lu", "react-icons/md", "react-icons/pi", "react-icons/ri", "react-icons/rx", "react-icons/si", "react-icons/sl", "react-icons/tb", "react-icons/tfi", "react-icons/ti", "react-icons/vsc", "react-icons/wi"], "trustHostHeader": false, "isExperimentalCompile": false }, "htmlLimitedBots": "[\\w-]+-Google|Google-[\\w-]+|Chrome-Lighthouse|Slurp|DuckDuckBot|baiduspider|yandex|sogou|bitlybot|tumblr|vkShare|quora link preview|redditbot|ia_archiver|Bingbot|BingPreview|applebot|facebookexternalhit|facebookcatalog|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|Yeti|googleweblight", "bundlePagesRouterDependencies": false, "configFileName": "next.config.ts", "turbopack": { "root": "C:\\Users\\HP\\Desktop\\IbnRochd\\next" }, "distDirRoot": ".next" };
var BuildId = "Ou2L0QShTTH3Q3qFl4PpX";
var HtmlPages = ["/404", "/500"];
var RoutesManifest = { "basePath": "", "rewrites": { "beforeFiles": [], "afterFiles": [], "fallback": [] }, "redirects": [{ "source": "/:path+/", "destination": "/:path+", "internal": true, "priority": true, "statusCode": 308, "regex": "^(?:/((?:[^/]+?)(?:/(?:[^/]+?))*))/$" }], "routes": { "static": [{ "page": "/", "regex": "^/(?:/)?$", "routeKeys": {}, "namedRegex": "^/(?:/)?$" }, { "page": "/_global-error", "regex": "^/_global\\-error(?:/)?$", "routeKeys": {}, "namedRegex": "^/_global\\-error(?:/)?$" }, { "page": "/_not-found", "regex": "^/_not\\-found(?:/)?$", "routeKeys": {}, "namedRegex": "^/_not\\-found(?:/)?$" }, { "page": "/api/categories", "regex": "^/api/categories(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/categories(?:/)?$" }, { "page": "/api/products", "regex": "^/api/products(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/products(?:/)?$" }, { "page": "/api/products/import", "regex": "^/api/products/import(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/products/import(?:/)?$" }, { "page": "/api/types", "regex": "^/api/types(?:/)?$", "routeKeys": {}, "namedRegex": "^/api/types(?:/)?$" }, { "page": "/clients", "regex": "^/clients(?:/)?$", "routeKeys": {}, "namedRegex": "^/clients(?:/)?$" }, { "page": "/clients/new", "regex": "^/clients/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/clients/new(?:/)?$" }, { "page": "/favicon.ico", "regex": "^/favicon\\.ico(?:/)?$", "routeKeys": {}, "namedRegex": "^/favicon\\.ico(?:/)?$" }, { "page": "/orders", "regex": "^/orders(?:/)?$", "routeKeys": {}, "namedRegex": "^/orders(?:/)?$" }, { "page": "/orders/new", "regex": "^/orders/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/orders/new(?:/)?$" }, { "page": "/products", "regex": "^/products(?:/)?$", "routeKeys": {}, "namedRegex": "^/products(?:/)?$" }, { "page": "/products/new", "regex": "^/products/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/products/new(?:/)?$" }, { "page": "/schools", "regex": "^/schools(?:/)?$", "routeKeys": {}, "namedRegex": "^/schools(?:/)?$" }, { "page": "/schools/new", "regex": "^/schools/new(?:/)?$", "routeKeys": {}, "namedRegex": "^/schools/new(?:/)?$" }, { "page": "/supplier-requests", "regex": "^/supplier\\-requests(?:/)?$", "routeKeys": {}, "namedRegex": "^/supplier\\-requests(?:/)?$" }], "dynamic": [{ "page": "/api/categories/[id]", "regex": "^/api/categories/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/categories/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/api/products/[id]", "regex": "^/api/products/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/products/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/api/products/[id]/stock", "regex": "^/api/products/([^/]+?)/stock(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/products/(?<nxtPid>[^/]+?)/stock(?:/)?$" }, { "page": "/api/types/[id]", "regex": "^/api/types/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/api/types/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/clients/[id]", "regex": "^/clients/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/clients/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/orders/[id]", "regex": "^/orders/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/orders/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/products/type/[id]", "regex": "^/products/type/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/products/type/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/products/[id]", "regex": "^/products/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/products/(?<nxtPid>[^/]+?)(?:/)?$" }, { "page": "/schools/[id]", "regex": "^/schools/([^/]+?)(?:/)?$", "routeKeys": { "nxtPid": "nxtPid" }, "namedRegex": "^/schools/(?<nxtPid>[^/]+?)(?:/)?$" }], "data": { "static": [], "dynamic": [] } }, "locales": [] };
var PrerenderManifest = { "version": 4, "routes": { "/_global-error": { "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_global-error", "dataRoute": "/_global-error.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/_not-found": { "initialStatus": 404, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/_not-found", "dataRoute": "/_not-found.rsc", "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] }, "/favicon.ico": { "initialHeaders": { "cache-control": "public, max-age=0, must-revalidate", "content-type": "image/x-icon", "x-next-cache-tags": "_N_T_/layout,_N_T_/favicon.ico/layout,_N_T_/favicon.ico/route,_N_T_/favicon.ico" }, "experimentalBypassFor": [{ "type": "header", "key": "next-action" }, { "type": "header", "key": "content-type", "value": "multipart/form-data;.*" }], "initialRevalidateSeconds": false, "srcRoute": "/favicon.ico", "dataRoute": null, "allowHeader": ["host", "x-matched-path", "x-prerender-revalidate", "x-prerender-revalidate-if-generated", "x-next-revalidated-tags", "x-next-revalidate-tag-token"] } }, "dynamicRoutes": {}, "notFoundRoutes": [], "preview": { "previewModeId": "6ef6ac8755257ff1a7c0dd4b65a0df23", "previewModeSigningKey": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2", "previewModeEncryptionKey": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2" } };
var MiddlewareManifest = { "version": 3, "middleware": {}, "sortedMiddleware": [], "functions": { "/(dashboard)/clients/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_0hzr3gu._.js", "server/app/(dashboard)/clients/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0_7jso4._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__0f1es-k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_20c3u9y.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1dewuqg.js", "server/app/(dashboard)/clients/[id]/page/react-loadable-manifest.js"], "name": "app/(dashboard)/clients/[id]/page", "page": "/(dashboard)/clients/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1dewuqg.js", "matchers": [{ "regexp": "^/clients/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/clients/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/clients/new/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_0y7j_r7._.js", "server/app/(dashboard)/clients/new/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0vzspve._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__1ptptay._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_18hb8gk.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_01q59ok.js", "server/app/(dashboard)/clients/new/page/react-loadable-manifest.js"], "name": "app/(dashboard)/clients/new/page", "page": "/(dashboard)/clients/new/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_01q59ok.js", "matchers": [{ "regexp": "^/clients/new(?:/)?$", "originalSource": "/clients/new" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/clients/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/src_components_1yluuli._.js", "server/app/(dashboard)/clients/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_clients_page_actions_1uwzntm.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_11jg-rs.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/[root-of-the-server]__0dxviif._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0-345kj.js", "server/app/(dashboard)/clients/page/react-loadable-manifest.js"], "name": "app/(dashboard)/clients/page", "page": "/(dashboard)/clients/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0-345kj.js", "matchers": [{ "regexp": "^/clients(?:/)?$", "originalSource": "/clients" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/orders/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_1uwrjqp._.js", "server/app/(dashboard)/orders/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0j_zwkl._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__1_mcz1v._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0-vyhvt.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1jq8fkz.js", "server/app/(dashboard)/orders/[id]/page/react-loadable-manifest.js"], "name": "app/(dashboard)/orders/[id]/page", "page": "/(dashboard)/orders/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1jq8fkz.js", "matchers": [{ "regexp": "^/orders/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/orders/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/orders/new/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_0x56zb6._.js", "server/app/(dashboard)/orders/new/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__1qjwd8f._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__1m2w7c-._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0_04st0.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0u08t8j.js", "server/app/(dashboard)/orders/new/page/react-loadable-manifest.js"], "name": "app/(dashboard)/orders/new/page", "page": "/(dashboard)/orders/new/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0u08t8j.js", "matchers": [{ "regexp": "^/orders/new(?:/)?$", "originalSource": "/orders/new" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/orders/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_080d0oa._.js", "server/app/(dashboard)/orders/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0n_6m7y._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__0kssz7_._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_17jaa7_.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_13m3loa.js", "server/app/(dashboard)/orders/page/react-loadable-manifest.js"], "name": "app/(dashboard)/orders/page", "page": "/(dashboard)/orders/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_13m3loa.js", "matchers": [{ "regexp": "^/orders(?:/)?$", "originalSource": "/orders" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/src_components_PageTitle_tsx_159p5f3._.js", "server/app/(dashboard)/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_page_actions_0kamfr_.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_19e3773.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/[root-of-the-server]__0emx5sp._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0jc134r.js", "server/app/(dashboard)/page/react-loadable-manifest.js"], "name": "app/(dashboard)/page", "page": "/(dashboard)/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0jc134r.js", "matchers": [{ "regexp": "^/(?:/)?$", "originalSource": "/" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/products/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_1b0tdmy._.js", "server/edge/chunks/ssr/src_components_ProductDetailsForm_tsx_0ok38od._.js", "server/edge/chunks/ssr/src_components_059t0ud._.js", "server/app/(dashboard)/products/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__1cm51lp._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__0hp3v4p._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0by_pvy.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_05_5bbv.js", "server/app/(dashboard)/products/[id]/page/react-loadable-manifest.js"], "name": "app/(dashboard)/products/[id]/page", "page": "/(dashboard)/products/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_05_5bbv.js", "matchers": [{ "regexp": "^/products/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/products/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/products/new/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/src_components_1bnsz-4._.js", "server/edge/chunks/ssr/src_components_059t0ud._.js", "server/app/(dashboard)/products/new/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_products_new_page_actions_1q6ym8i.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_05sdiv2.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/[root-of-the-server]__19discg._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1e8pgtp.js", "server/app/(dashboard)/products/new/page/react-loadable-manifest.js"], "name": "app/(dashboard)/products/new/page", "page": "/(dashboard)/products/new/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1e8pgtp.js", "matchers": [{ "regexp": "^/products/new(?:/)?$", "originalSource": "/products/new" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/products/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_0niy9vb._.js", "server/app/(dashboard)/products/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_products_page_actions_19lxnkn.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/[root-of-the-server]__0k8qg8l._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_105b-ok.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1lv0kht.js", "server/app/(dashboard)/products/page/react-loadable-manifest.js"], "name": "app/(dashboard)/products/page", "page": "/(dashboard)/products/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1lv0kht.js", "matchers": [{ "regexp": "^/products(?:/)?$", "originalSource": "/products" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/products/type/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_1qmy5jz._.js", "server/app/(dashboard)/products/type/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_products_type_[id]_page_actions_1r0rqxk.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0mob64z.js", "server/edge/chunks/ssr/[root-of-the-server]__18zbn5s._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_18653de.js", "server/app/(dashboard)/products/type/[id]/page/react-loadable-manifest.js"], "name": "app/(dashboard)/products/type/[id]/page", "page": "/(dashboard)/products/type/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_18653de.js", "matchers": [{ "regexp": "^/products/type/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/products/type/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/schools/[id]/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_0k3a5ov._.js", "server/app/(dashboard)/schools/[id]/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__09eurj7._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__0exhp9c._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0bz67yn.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1-j1vrp.js", "server/app/(dashboard)/schools/[id]/page/react-loadable-manifest.js"], "name": "app/(dashboard)/schools/[id]/page", "page": "/(dashboard)/schools/[id]/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1-j1vrp.js", "matchers": [{ "regexp": "^/schools/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/schools/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/schools/new/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_1ul8ax3._.js", "server/app/(dashboard)/schools/new/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__01hsfqn._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__0ui9dl7._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_1xm7_wk.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_112_l8p.js", "server/app/(dashboard)/schools/new/page/react-loadable-manifest.js"], "name": "app/(dashboard)/schools/new/page", "page": "/(dashboard)/schools/new/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_112_l8p.js", "matchers": [{ "regexp": "^/schools/new(?:/)?$", "originalSource": "/schools/new" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/schools/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/src_components_PageTitle_tsx_159p5f3._.js", "server/app/(dashboard)/schools/page_client-reference-manifest.js", "server/edge/chunks/ssr/_next-internal_server_app_(dashboard)_schools_page_actions_1e3pj61.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1e_4i_x._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0uvz-z9.js", "server/edge/chunks/ssr/[root-of-the-server]__0fdw5b9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_next_dist_0heorwv._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0v5rxve.js", "server/app/(dashboard)/schools/page/react-loadable-manifest.js"], "name": "app/(dashboard)/schools/page", "page": "/(dashboard)/schools/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0v5rxve.js", "matchers": [{ "regexp": "^/schools(?:/)?$", "originalSource": "/schools" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/(dashboard)/supplier-requests/page": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/next-font-manifest.js", "server/server-reference-manifest.js", "server/edge/chunks/ssr/_0886y-7._.js", "server/edge/chunks/ssr/node_modules_next_dist_0h7pkfs._.js", "server/edge/chunks/ssr/node_modules_next_dist_1xc97ap._.js", "server/edge/chunks/ssr/node_modules_0n8lg1c._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1zxnqeb._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_215mm78._.js", "server/edge/chunks/ssr/node_modules_next_dist_0iea_qs._.js", "server/edge/chunks/ssr/_1cjwd6f._.js", "server/edge/chunks/ssr/_179pz-5._.js", "server/edge/chunks/ssr/src_components_SupplierRequests_tsx_1cmwa72._.js", "server/app/(dashboard)/supplier-requests/page_client-reference-manifest.js", "server/edge/chunks/ssr/[root-of-the-server]__0sxc44_._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_1scftyu._.js", "server/edge/chunks/ssr/_1vqsr_5._.js", "server/edge/chunks/ssr/node_modules_next_dist_0icvg3a._.js", "server/edge/chunks/ssr/node_modules_next_dist_compiled_0czwz5q._.js", "server/edge/chunks/ssr/_1dtpt4h._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_server_lib_patch-fetch_1a94epc.js", "server/edge/chunks/ssr/node_modules_0g187z3._.js", "server/edge/chunks/ssr/[root-of-the-server]__07_jt9m._.js", "server/edge/chunks/ssr/node_modules_next_dist_059m72z._.js", "server/edge/chunks/ssr/node_modules_next_dist_0gw-97a._.js", "server/edge/chunks/ssr/node_modules_next_dist_1mpfqfi._.js", "server/edge/chunks/ssr/node_modules_next_dist_0hvoqp9._.js", "server/edge/chunks/ssr/node_modules_0snrk9m._.js", "server/edge/chunks/ssr/[root-of-the-server]__1718eb1._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_0go9b6k._.js", "server/edge/chunks/ssr/node_modules_next_dist_esm_build_templates_edge-ssr-app_0xlquue.js", "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_15b3dn7.js", "server/app/(dashboard)/supplier-requests/page/react-loadable-manifest.js"], "name": "app/(dashboard)/supplier-requests/page", "page": "/(dashboard)/supplier-requests/page", "entrypoint": "server/edge/chunks/ssr/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_15b3dn7.js", "matchers": [{ "regexp": "^/supplier-requests(?:/)?$", "originalSource": "/supplier-requests" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/categories/[id]/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/categories/[id]/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_categories_[id]_route_actions_0k40h06.js", "server/edge/chunks/[root-of-the-server]__0f4_axj._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1m160kb.js"], "name": "app/api/categories/[id]/route", "page": "/api/categories/[id]/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1m160kb.js", "matchers": [{ "regexp": "^/api/categories/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/api/categories/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/categories/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/categories/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_categories_route_actions_0ao29n_.js", "server/edge/chunks/[root-of-the-server]__0dqgbg-._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0p2he0u.js"], "name": "app/api/categories/route", "page": "/api/categories/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_0p2he0u.js", "matchers": [{ "regexp": "^/api/categories(?:/)?$", "originalSource": "/api/categories" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/products/[id]/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/products/[id]/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_products_[id]_route_actions_1sn1oej.js", "server/edge/chunks/[root-of-the-server]__0m-tawj._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1gcyibw.js"], "name": "app/api/products/[id]/route", "page": "/api/products/[id]/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1gcyibw.js", "matchers": [{ "regexp": "^/api/products/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/api/products/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/products/[id]/stock/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/products/[id]/stock/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_products_[id]_stock_route_actions_0rp1fnx.js", "server/edge/chunks/[root-of-the-server]__097xa9l._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1y3dno5.js"], "name": "app/api/products/[id]/stock/route", "page": "/api/products/[id]/stock/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1y3dno5.js", "matchers": [{ "regexp": "^/api/products/(?P<nxtPid>[^/]+?)/stock(?:/)?$", "originalSource": "/api/products/[id]/stock" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/products/import/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/products/import/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_products_import_route_actions_0-twn__.js", "server/edge/chunks/[root-of-the-server]__0eerr68._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/node_modules_next_dist_esm_build_templates_edge-app-route_1kyyglj.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_18o6nf0.js"], "name": "app/api/products/import/route", "page": "/api/products/import/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_18o6nf0.js", "matchers": [{ "regexp": "^/api/products/import(?:/)?$", "originalSource": "/api/products/import" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/products/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/products/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_products_route_actions_149s5tv.js", "server/edge/chunks/[root-of-the-server]__1eho34r._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_099-k-j.js"], "name": "app/api/products/route", "page": "/api/products/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_099-k-j.js", "matchers": [{ "regexp": "^/api/products(?:/)?$", "originalSource": "/api/products" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/types/[id]/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/types/[id]/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_types_[id]_route_actions_14uuw0w.js", "server/edge/chunks/[root-of-the-server]__1vrewwy._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1irvab-.js"], "name": "app/api/types/[id]/route", "page": "/api/types/[id]/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1irvab-.js", "matchers": [{ "regexp": "^/api/types/(?P<nxtPid>[^/]+?)(?:/)?$", "originalSource": "/api/types/[id]" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } }, "/api/types/route": { "files": ["server/middleware-build-manifest.js", "server/interception-route-rewrite-manifest.js", "required-server-files.js", "server/server-reference-manifest.js", "server/app/api/types/route_client-reference-manifest.js", "server/edge/chunks/_next-internal_server_app_api_types_route_actions_0z82lzw.js", "server/edge/chunks/[root-of-the-server]__009gh41._.js", "server/edge/chunks/node_modules_next_dist_10ig42v._.js", "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1tufv8b.js"], "name": "app/api/types/route", "page": "/api/types/route", "entrypoint": "server/edge/chunks/turbopack-node_modules_next_dist_esm_build_templates_edge-wrapper_1tufv8b.js", "matchers": [{ "regexp": "^/api/types(?:/)?$", "originalSource": "/api/types" }], "wasm": [], "assets": [], "env": { "__NEXT_BUILD_ID": "Ou2L0QShTTH3Q3qFl4PpX", "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY": "wNlyGjKgZHrToQOEtXOzTWPOsAZYiAR/aKs3IOjK6Co=", "__NEXT_PREVIEW_MODE_ID": "6ef6ac8755257ff1a7c0dd4b65a0df23", "__NEXT_PREVIEW_MODE_ENCRYPTION_KEY": "f9620a6e8bb6e10c3dac6012e9c281711fd8e16ba49a5b8479a90d77cc4f95c2", "__NEXT_PREVIEW_MODE_SIGNING_KEY": "e29848c831e66ee729fd2888d7a71811dd9151aa20710167a34a1bf48a4afcb2" } } } };
var AppPathRoutesManifest = { "/(dashboard)/clients/[id]/page": "/clients/[id]", "/(dashboard)/clients/new/page": "/clients/new", "/(dashboard)/clients/page": "/clients", "/(dashboard)/orders/[id]/page": "/orders/[id]", "/(dashboard)/orders/new/page": "/orders/new", "/(dashboard)/orders/page": "/orders", "/(dashboard)/page": "/", "/(dashboard)/products/[id]/page": "/products/[id]", "/(dashboard)/products/new/page": "/products/new", "/(dashboard)/products/page": "/products", "/(dashboard)/products/type/[id]/page": "/products/type/[id]", "/(dashboard)/schools/[id]/page": "/schools/[id]", "/(dashboard)/schools/new/page": "/schools/new", "/(dashboard)/schools/page": "/schools", "/(dashboard)/supplier-requests/page": "/supplier-requests", "/_global-error/page": "/_global-error", "/_not-found/page": "/_not-found", "/api/categories/[id]/route": "/api/categories/[id]", "/api/categories/route": "/api/categories", "/api/products/[id]/route": "/api/products/[id]", "/api/products/[id]/stock/route": "/api/products/[id]/stock", "/api/products/import/route": "/api/products/import", "/api/products/route": "/api/products", "/api/types/[id]/route": "/api/types/[id]", "/api/types/route": "/api/types", "/favicon.ico/route": "/favicon.ico" };
var FunctionsConfigManifest = { "version": 1, "functions": { "/": {}, "/api/categories": {}, "/api/categories/[id]": {}, "/api/products": {}, "/api/products/[id]": {}, "/api/products/[id]/stock": {}, "/api/products/import": {}, "/api/types": {}, "/api/types/[id]": {}, "/clients": {}, "/clients/[id]": {}, "/clients/new": {}, "/orders": {}, "/orders/[id]": {}, "/orders/new": {}, "/products": {}, "/products/[id]": {}, "/products/new": {}, "/products/type/[id]": {}, "/schools": {}, "/schools/[id]": {}, "/schools/new": {}, "/supplier-requests": {} } };
var PagesManifest = { "/404": "pages/404.html", "/500": "pages/500.html" };
process.env.NEXT_BUILD_ID = BuildId;
process.env.OPEN_NEXT_BUILD_ID = NextConfig.deploymentId ?? BuildId;
process.env.NEXT_PREVIEW_MODE_ID = PrerenderManifest?.preview?.previewModeId;

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/patchAsyncStorage.js
var mod = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename = mod._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/routing/util.js
import crypto from "node:crypto";
init_util();
init_logger();
import { ReadableStream as ReadableStream3 } from "node:stream/web";

// node_modules/@opennextjs/aws/dist/utils/binary.js
var commonBinaryMimeTypes = /* @__PURE__ */ new Set([
  "application/octet-stream",
  // Docs
  "application/epub+zip",
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.amazon.ebook",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Fonts
  "font/otf",
  "font/woff",
  "font/woff2",
  // Images
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/vnd.microsoft.icon",
  "image/webp",
  // Audio
  "audio/3gpp",
  "audio/aac",
  "audio/basic",
  "audio/flac",
  "audio/mpeg",
  "audio/ogg",
  "audio/wavaudio/webm",
  "audio/x-aiff",
  "audio/x-midi",
  "audio/x-wav",
  // Video
  "video/3gpp",
  "video/mp2t",
  "video/mpeg",
  "video/ogg",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  // Archives
  "application/java-archive",
  "application/vnd.apple.installer+xml",
  "application/x-7z-compressed",
  "application/x-apple-diskimage",
  "application/x-bzip",
  "application/x-bzip2",
  "application/x-gzip",
  "application/x-java-archive",
  "application/x-rar-compressed",
  "application/x-tar",
  "application/x-zip",
  "application/zip",
  // Serialized data
  "application/x-protobuf"
]);
function isBinaryContentType(contentType) {
  if (!contentType)
    return false;
  const value = contentType.split(";")[0];
  return commonBinaryMimeTypes.has(value);
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/i18n/accept-header.js
function parse(raw, preferences, options) {
  const lowers = /* @__PURE__ */ new Map();
  const header = raw.replace(/[ \t]/g, "");
  if (preferences) {
    let pos = 0;
    for (const preference of preferences) {
      const lower = preference.toLowerCase();
      lowers.set(lower, { orig: preference, pos: pos++ });
      if (options.prefixMatch) {
        const parts2 = lower.split("-");
        while (parts2.pop(), parts2.length > 0) {
          const joined = parts2.join("-");
          if (!lowers.has(joined)) {
            lowers.set(joined, { orig: preference, pos: pos++ });
          }
        }
      }
    }
  }
  const parts = header.split(",");
  const selections = [];
  const map = /* @__PURE__ */ new Set();
  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];
    if (!part) {
      continue;
    }
    const params = part.split(";");
    if (params.length > 2) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const token = params[0].toLowerCase();
    if (!token) {
      throw new Error(`Invalid ${options.type} header`);
    }
    const selection = { token, pos: i, q: 1 };
    if (preferences && lowers.has(token)) {
      selection.pref = lowers.get(token).pos;
    }
    map.add(selection.token);
    if (params.length === 2) {
      const q = params[1];
      const [key, value] = q.split("=");
      if (!value || key !== "q" && key !== "Q") {
        throw new Error(`Invalid ${options.type} header`);
      }
      const score = Number.parseFloat(value);
      if (score === 0) {
        continue;
      }
      if (Number.isFinite(score) && score <= 1 && score >= 1e-3) {
        selection.q = score;
      }
    }
    selections.push(selection);
  }
  selections.sort((a, b) => {
    if (b.q !== a.q) {
      return b.q - a.q;
    }
    if (b.pref !== a.pref) {
      if (a.pref === void 0) {
        return 1;
      }
      if (b.pref === void 0) {
        return -1;
      }
      return a.pref - b.pref;
    }
    return a.pos - b.pos;
  });
  const values = selections.map((selection) => selection.token);
  if (!preferences || !preferences.length) {
    return values;
  }
  const preferred = [];
  for (const selection of values) {
    if (selection === "*") {
      for (const [preference, value] of lowers) {
        if (!map.has(preference)) {
          preferred.push(value.orig);
        }
      }
    } else {
      const lower = selection.toLowerCase();
      if (lowers.has(lower)) {
        preferred.push(lowers.get(lower).orig);
      }
    }
  }
  return preferred;
}
function acceptLanguage(header = "", preferences) {
  return parse(header, preferences, {
    type: "accept-language",
    prefixMatch: true
  })[0] || void 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/i18n/index.js
function isLocalizedPath(path2) {
  return NextConfig.i18n?.locales.includes(path2.split("/")[1].toLowerCase()) ?? false;
}
function getLocaleFromCookie(cookies) {
  const i18n = NextConfig.i18n;
  const nextLocale = cookies.NEXT_LOCALE?.toLowerCase();
  return nextLocale ? i18n?.locales.find((locale) => nextLocale === locale.toLowerCase()) : void 0;
}
function detectDomainLocale({ hostname, detectedLocale }) {
  const i18n = NextConfig.i18n;
  const domains = i18n?.domains;
  if (!domains) {
    return;
  }
  const lowercasedLocale = detectedLocale?.toLowerCase();
  for (const domain of domains) {
    const domainHostname = domain.domain.split(":", 1)[0].toLowerCase();
    if (hostname === domainHostname || lowercasedLocale === domain.defaultLocale.toLowerCase() || domain.locales?.some((locale) => lowercasedLocale === locale.toLowerCase())) {
      return domain;
    }
  }
}
function detectLocale(internalEvent, i18n) {
  const domainLocale = detectDomainLocale({
    hostname: internalEvent.headers.host
  });
  if (i18n.localeDetection === false) {
    return domainLocale?.defaultLocale ?? i18n.defaultLocale;
  }
  const cookiesLocale = getLocaleFromCookie(internalEvent.cookies);
  const preferredLocale = acceptLanguage(internalEvent.headers["accept-language"], i18n?.locales);
  debug({
    cookiesLocale,
    preferredLocale,
    defaultLocale: i18n.defaultLocale,
    domainLocale
  });
  return domainLocale?.defaultLocale ?? cookiesLocale ?? preferredLocale ?? i18n.defaultLocale;
}
function localizePath(internalEvent) {
  const i18n = NextConfig.i18n;
  if (!i18n) {
    return internalEvent.rawPath;
  }
  if (isLocalizedPath(internalEvent.rawPath)) {
    return internalEvent.rawPath;
  }
  const detectedLocale = detectLocale(internalEvent, i18n);
  return `/${detectedLocale}${internalEvent.rawPath}`;
}

// node_modules/@opennextjs/aws/dist/core/routing/queue.js
function generateShardId(rawPath, maxConcurrency, prefix) {
  let a = cyrb128(rawPath);
  let t = a += 1831565813;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  const randomFloat = ((t ^ t >>> 14) >>> 0) / 4294967296;
  const randomInt = Math.floor(randomFloat * maxConcurrency);
  return `${prefix}-${randomInt}`;
}
function generateMessageGroupId(rawPath) {
  const maxConcurrency = Number.parseInt(process.env.MAX_REVALIDATE_CONCURRENCY ?? "10");
  return generateShardId(rawPath, maxConcurrency, "revalidate");
}
function cyrb128(str) {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ h1 >>> 18, 597399067);
  h2 = Math.imul(h4 ^ h2 >>> 22, 2869860233);
  h3 = Math.imul(h1 ^ h3 >>> 17, 951274213);
  h4 = Math.imul(h2 ^ h4 >>> 19, 2716044179);
  h1 ^= h2 ^ h3 ^ h4, h2 ^= h1, h3 ^= h1, h4 ^= h1;
  return h1 >>> 0;
}

// node_modules/@opennextjs/aws/dist/core/routing/util.js
function constructNextUrl(baseUrl, path2) {
  const nextBasePath = NextConfig.basePath ?? "";
  const url = new URL(`${nextBasePath}${path2}`, baseUrl);
  return url.href;
}
function convertRes(res) {
  const statusCode = res.statusCode || 200;
  const headers = parseHeaders(res.getFixedHeaders());
  const isBase64Encoded = isBinaryContentType(headers["content-type"]) || !!headers["content-encoding"];
  const body = new ReadableStream3({
    pull(controller) {
      if (!res._chunks || res._chunks.length === 0) {
        controller.close();
        return;
      }
      controller.enqueue(res._chunks.shift());
    }
  });
  return {
    type: "core",
    statusCode,
    headers,
    body,
    isBase64Encoded
  };
}
function convertToQueryString(query) {
  const queryStrings = [];
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => queryStrings.push(`${key}=${entry}`));
    } else {
      queryStrings.push(`${key}=${value}`);
    }
  });
  return queryStrings.length > 0 ? `?${queryStrings.join("&")}` : "";
}
function convertToQuery(querystring) {
  if (!querystring)
    return {};
  const query = new URLSearchParams(querystring);
  const queryObject = {};
  for (const key of query.keys()) {
    const queries = query.getAll(key);
    queryObject[key] = queries.length > 1 ? queries : queries[0];
  }
  return queryObject;
}
function getMiddlewareMatch(middlewareManifest2, functionsManifest) {
  if (functionsManifest?.functions?.["/_middleware"]) {
    return functionsManifest.functions["/_middleware"].matchers?.map(({ regexp }) => new RegExp(regexp)) ?? [/.*/];
  }
  const rootMiddleware = middlewareManifest2.middleware["/"];
  if (!rootMiddleware?.matchers)
    return [];
  return rootMiddleware.matchers.map(({ regexp }) => new RegExp(regexp));
}
var CommonHeaders;
(function(CommonHeaders2) {
  CommonHeaders2["CACHE_CONTROL"] = "cache-control";
  CommonHeaders2["NEXT_CACHE"] = "x-nextjs-cache";
})(CommonHeaders || (CommonHeaders = {}));
function fixCacheHeaderForHtmlPages(internalEvent, headers) {
  if (internalEvent.rawPath === "/404" || internalEvent.rawPath === "/500") {
    if (process.env.OPEN_NEXT_DANGEROUSLY_SET_ERROR_HEADERS === "true") {
      return;
    }
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const localizedPath = localizePath(internalEvent);
  if (HtmlPages.includes(localizedPath) && !internalEvent.headers["x-middleware-prefetch"]) {
    headers[CommonHeaders.CACHE_CONTROL] = "public, max-age=0, s-maxage=31536000, must-revalidate";
  }
}
function fixSWRCacheHeader(headers) {
  let cacheControl = headers[CommonHeaders.CACHE_CONTROL];
  if (!cacheControl)
    return;
  if (Array.isArray(cacheControl)) {
    cacheControl = cacheControl.join(",");
  }
  if (typeof cacheControl !== "string")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = cacheControl.replace(/\bstale-while-revalidate(?!=)/, "stale-while-revalidate=2592000");
}
function addOpenNextHeader(headers) {
  if (NextConfig.poweredByHeader) {
    headers["X-OpenNext"] = "1";
  }
  if (globalThis.openNextDebug) {
    headers["X-OpenNext-Version"] = globalThis.openNextVersion;
  }
  if (process.env.OPEN_NEXT_REQUEST_ID_HEADER || globalThis.openNextDebug) {
    headers["X-OpenNext-RequestId"] = globalThis.__openNextAls.getStore()?.requestId;
  }
}
async function revalidateIfRequired(host, rawPath, headers, req) {
  if (headers[CommonHeaders.NEXT_CACHE] === "STALE") {
    const internalMeta = req?.[Symbol.for("NextInternalRequestMeta")];
    const revalidateUrl = internalMeta?._nextDidRewrite ? rawPath.startsWith("/_next/data/") ? `/_next/data/${BuildId}${internalMeta?._nextRewroteUrl}.json` : internalMeta?._nextRewroteUrl : rawPath;
    try {
      const hash = (str) => crypto.createHash("md5").update(str).digest("hex");
      const lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
      const eTag = `${headers.etag ?? headers.ETag ?? ""}`;
      await globalThis.queue.send({
        MessageBody: { host, url: revalidateUrl, eTag, lastModified },
        MessageDeduplicationId: hash(`${rawPath}-${lastModified}-${eTag}`),
        MessageGroupId: generateMessageGroupId(rawPath)
      });
    } catch (e) {
      error(`Failed to revalidate stale page ${rawPath}`, e);
    }
  }
}
function fixISRHeaders(headers) {
  const sMaxAgeRegex = /s-maxage=(\d+)/;
  const match = headers[CommonHeaders.CACHE_CONTROL]?.match(sMaxAgeRegex);
  const sMaxAge = match ? Number.parseInt(match[1]) : void 0;
  if (!sMaxAge) {
    return;
  }
  if (headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    headers[CommonHeaders.CACHE_CONTROL] = "private, no-cache, no-store, max-age=0, must-revalidate";
    return;
  }
  const _lastModified = globalThis.__openNextAls.getStore()?.lastModified ?? 0;
  if (headers[CommonHeaders.NEXT_CACHE] === "HIT" && _lastModified > 0) {
    debug("cache-control", headers[CommonHeaders.CACHE_CONTROL], _lastModified, Date.now());
    if (sMaxAge && sMaxAge !== 31536e3) {
      const age = Math.round((Date.now() - _lastModified) / 1e3);
      const remainingTtl = Math.max(sMaxAge - age, 1);
      headers[CommonHeaders.CACHE_CONTROL] = `s-maxage=${remainingTtl}, stale-while-revalidate=2592000`;
    }
  }
  if (headers[CommonHeaders.NEXT_CACHE] !== "STALE")
    return;
  headers[CommonHeaders.CACHE_CONTROL] = "s-maxage=2, stale-while-revalidate=2592000";
}
function createServerResponse(routingResult, headers, responseStream) {
  const internalEvent = routingResult.internalEvent;
  return new OpenNextNodeResponse((_headers) => {
    fixCacheHeaderForHtmlPages(internalEvent, _headers);
    fixSWRCacheHeader(_headers);
    addOpenNextHeader(_headers);
    fixISRHeaders(_headers);
  }, async (_headers) => {
    await revalidateIfRequired(internalEvent.headers.host, internalEvent.rawPath, _headers);
    await invalidateCDNOnRequest(routingResult, _headers);
  }, responseStream, headers, routingResult.rewriteStatusCode);
}
async function invalidateCDNOnRequest(params, headers) {
  const { internalEvent, resolvedRoutes, initialURL } = params;
  const initialPath = new URL(initialURL).pathname;
  const isIsrRevalidation = internalEvent.headers["x-isr"] === "1";
  if (!isIsrRevalidation && headers[CommonHeaders.NEXT_CACHE] === "REVALIDATED") {
    await globalThis.cdnInvalidationHandler.invalidatePaths([
      {
        initialPath,
        rawPath: internalEvent.rawPath,
        resolvedRoutes
      }
    ]);
  }
}

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_stream();

// node_modules/@opennextjs/aws/dist/utils/cache.js
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/cacheInterceptor.js
init_logger();
var CACHE_ONE_YEAR = 60 * 60 * 24 * 365;
var CACHE_ONE_MONTH = 60 * 60 * 24 * 30;

// node_modules/@opennextjs/aws/dist/core/routing/matcher.js
init_stream();
init_logger();

// node_modules/@opennextjs/aws/dist/core/routing/routeMatcher.js
var optionalLocalePrefixRegex = `^/(?:${RoutesManifest.locales.map((locale) => `${locale}/?`).join("|")})?`;
var optionalBasepathPrefixRegex = RoutesManifest.basePath ? `^${RoutesManifest.basePath}/?` : "^/";
var optionalPrefix = optionalLocalePrefixRegex.replace("^/", optionalBasepathPrefixRegex);
function routeMatcher(routeDefinitions) {
  const regexp = routeDefinitions.map((route) => ({
    page: route.page,
    regexp: new RegExp(route.regex.replace("^/", optionalPrefix))
  }));
  const appPathsSet = /* @__PURE__ */ new Set();
  const routePathsSet = /* @__PURE__ */ new Set();
  for (const [k, v] of Object.entries(AppPathRoutesManifest)) {
    if (k.endsWith("page")) {
      appPathsSet.add(v);
    } else if (k.endsWith("route")) {
      routePathsSet.add(v);
    }
  }
  return function matchRoute(path2) {
    const foundRoutes = regexp.filter((route) => route.regexp.test(path2));
    return foundRoutes.map((foundRoute) => {
      let routeType = "page";
      if (appPathsSet.has(foundRoute.page)) {
        routeType = "app";
      } else if (routePathsSet.has(foundRoute.page)) {
        routeType = "route";
      }
      return {
        route: foundRoute.page,
        type: routeType
      };
    });
  };
}
var staticRouteMatcher = routeMatcher([
  ...RoutesManifest.routes.static,
  ...getStaticAPIRoutes()
]);
var dynamicRouteMatcher = routeMatcher(RoutesManifest.routes.dynamic);
function getStaticAPIRoutes() {
  const createRouteDefinition = (route) => ({
    page: route,
    regex: `^${route}(?:/)?$`
  });
  const dynamicRoutePages = new Set(RoutesManifest.routes.dynamic.map(({ page }) => page));
  const pagesStaticAPIRoutes = Object.keys(PagesManifest).filter((route) => route.startsWith("/api/") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  const appPathsStaticAPIRoutes = Object.values(AppPathRoutesManifest).filter((route) => (route.startsWith("/api/") || route === "/api") && !dynamicRoutePages.has(route)).map(createRouteDefinition);
  return [...pagesStaticAPIRoutes, ...appPathsStaticAPIRoutes];
}

// node_modules/@opennextjs/aws/dist/core/routing/middleware.js
init_stream();
init_utils();
var middlewareManifest = MiddlewareManifest;
var functionsConfigManifest = FunctionsConfigManifest;
var middleMatch = getMiddlewareMatch(middlewareManifest, functionsConfigManifest);

// node_modules/@opennextjs/aws/dist/core/routingHandler.js
var MIDDLEWARE_HEADER_PREFIX = "x-middleware-response-";
var MIDDLEWARE_HEADER_PREFIX_LEN = MIDDLEWARE_HEADER_PREFIX.length;
var INTERNAL_HEADER_PREFIX = "x-opennext-";
var INTERNAL_HEADER_INITIAL_URL = `${INTERNAL_HEADER_PREFIX}initial-url`;
var INTERNAL_HEADER_LOCALE = `${INTERNAL_HEADER_PREFIX}locale`;
var INTERNAL_HEADER_RESOLVED_ROUTES = `${INTERNAL_HEADER_PREFIX}resolved-routes`;
var INTERNAL_HEADER_REWRITE_STATUS_CODE = `${INTERNAL_HEADER_PREFIX}rewrite-status-code`;
var INTERNAL_EVENT_REQUEST_ID = `${INTERNAL_HEADER_PREFIX}request-id`;

// node_modules/@opennextjs/aws/dist/core/util.js
init_logger();
import NextServer from "next/dist/server/next-server.js";

// node_modules/@opennextjs/aws/dist/core/require-hooks.js
init_logger();
var mod2 = (init_node_module(), __toCommonJS(node_module_exports));
var resolveFilename2 = mod2._resolveFilename;

// node_modules/@opennextjs/aws/dist/core/util.js
var cacheHandlerPath = __require.resolve("./cache.cjs");
var composableCacheHandlerPath = __require.resolve("./composable-cache.cjs");
var nextServer = new NextServer.default({
  conf: {
    ...NextConfig,
    // Next.js compression should be disabled because of a bug in the bundled
    // `compression` package — https://github.com/vercel/next.js/issues/11669
    compress: false,
    // By default, Next.js uses local disk to store ISR cache. We will use
    // our own cache handler to store the cache on S3.
    //#override stableIncrementalCache
    cacheHandler: cacheHandlerPath,
    cacheMaxMemorySize: 0,
    // We need to disable memory cache
    //#endOverride
    experimental: {
      ...NextConfig.experimental,
      // This uses the request.headers.host as the URL
      // https://github.com/vercel/next.js/blob/canary/packages/next/src/server/next-server.ts#L1749-L1754
      //#override trustHostHeader
      trustHostHeader: true,
      //#endOverride
      //#override composableCache
      cacheHandlers: {
        default: composableCacheHandlerPath
      }
      //#endOverride
    }
  },
  customServer: false,
  dev: false,
  dir: __dirname
});
var routesLoaded = false;
globalThis.__next_route_preloader = async (stage) => {
  if (routesLoaded) {
    return;
  }
  const thisFunction = globalThis.fnName ? globalThis.openNextConfig.functions[globalThis.fnName] : globalThis.openNextConfig.default;
  const routePreloadingBehavior = thisFunction?.routePreloadingBehavior ?? "none";
  if (routePreloadingBehavior === "none") {
    routesLoaded = true;
    return;
  }
  if (!("unstable_preloadEntries" in nextServer)) {
    debug("The current version of Next.js does not support route preloading. Skipping route preloading.");
    routesLoaded = true;
    return;
  }
  if (stage === "waitUntil" && routePreloadingBehavior === "withWaitUntil") {
    const waitUntil = globalThis.__openNextAls.getStore()?.waitUntil;
    if (!waitUntil) {
      error("You've tried to use the 'withWaitUntil' route preloading behavior, but the 'waitUntil' function is not available.");
      routesLoaded = true;
      return;
    }
    debug("Preloading entries with waitUntil");
    waitUntil?.(nextServer.unstable_preloadEntries());
    routesLoaded = true;
  } else if (stage === "start" && routePreloadingBehavior === "onStart" || stage === "warmerEvent" && routePreloadingBehavior === "onWarmerEvent" || stage === "onDemand") {
    const startTimestamp = Date.now();
    debug("Preloading entries");
    await nextServer.unstable_preloadEntries();
    debug("Preloading entries took", Date.now() - startTimestamp, "ms");
    routesLoaded = true;
  }
};
var requestHandler = (metadata) => "getRequestHandlerWithMetadata" in nextServer ? nextServer.getRequestHandlerWithMetadata(metadata) : nextServer.getRequestHandler();

// node_modules/@opennextjs/aws/dist/core/requestHandler.js
globalThis.__openNextAls = new AsyncLocalStorage();
async function openNextHandler(internalEvent, options) {
  const initialHeaders = internalEvent.headers;
  const requestId = globalThis.openNextConfig.middleware?.external ? internalEvent.headers[INTERNAL_EVENT_REQUEST_ID] : Math.random().toString(36);
  return runWithOpenNextRequestContext({
    isISRRevalidation: initialHeaders["x-isr"] === "1",
    waitUntil: options?.waitUntil,
    requestId
  }, async () => {
    await globalThis.__next_route_preloader("waitUntil");
    if (initialHeaders["x-forwarded-host"]) {
      initialHeaders.host = initialHeaders["x-forwarded-host"];
    }
    debug("internalEvent", internalEvent);
    const internalHeaders = {
      initialPath: initialHeaders[INTERNAL_HEADER_INITIAL_URL] ?? internalEvent.rawPath,
      resolvedRoutes: initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES] ? JSON.parse(initialHeaders[INTERNAL_HEADER_RESOLVED_ROUTES]) : [],
      rewriteStatusCode: Number.parseInt(initialHeaders[INTERNAL_HEADER_REWRITE_STATUS_CODE])
    };
    let routingResult = {
      internalEvent,
      isExternalRewrite: false,
      origin: false,
      isISR: false,
      initialURL: internalEvent.url,
      ...internalHeaders
    };
    const headers = "type" in routingResult ? routingResult.headers : routingResult.internalEvent.headers;
    const overwrittenResponseHeaders = {};
    for (const [rawKey, value] of Object.entries(headers)) {
      if (!rawKey.startsWith(MIDDLEWARE_HEADER_PREFIX)) {
        continue;
      }
      const key = rawKey.slice(MIDDLEWARE_HEADER_PREFIX_LEN);
      if (key !== "x-middleware-set-cookie") {
        overwrittenResponseHeaders[key] = value;
      }
      headers[key] = value;
      delete headers[rawKey];
    }
    if ("isExternalRewrite" in routingResult && routingResult.isExternalRewrite === true) {
      try {
        routingResult = await globalThis.proxyExternalRequest.proxy(routingResult.internalEvent);
      } catch (e) {
        error("External request failed.", e);
        routingResult = {
          internalEvent: {
            type: "core",
            rawPath: "/500",
            method: "GET",
            headers: {},
            url: constructNextUrl(internalEvent.url, "/500"),
            query: {},
            cookies: {},
            remoteAddress: ""
          },
          // On error we need to rewrite to the 500 page which is an internal rewrite
          isExternalRewrite: false,
          isISR: false,
          origin: false,
          initialURL: internalEvent.url,
          resolvedRoutes: [{ route: "/500", type: "page" }]
        };
      }
    }
    if ("type" in routingResult) {
      if (options?.streamCreator) {
        const response = createServerResponse({
          internalEvent,
          isExternalRewrite: false,
          isISR: false,
          resolvedRoutes: [],
          origin: false,
          initialURL: internalEvent.url
        }, routingResult.headers, options.streamCreator);
        response.statusCode = routingResult.statusCode;
        response.flushHeaders();
        const [bodyToConsume, bodyToReturn] = routingResult.body.tee();
        for await (const chunk of bodyToConsume) {
          response.write(chunk);
        }
        response.end();
        routingResult.body = bodyToReturn;
      }
      return routingResult;
    }
    const preprocessedEvent = routingResult.internalEvent;
    debug("preprocessedEvent", preprocessedEvent);
    const { search, pathname, hash } = new URL(preprocessedEvent.url);
    const reqProps = {
      method: preprocessedEvent.method,
      url: `${pathname}${search}${hash}`,
      //WORKAROUND: We pass this header to the serverless function to mimic a prefetch request which will not trigger revalidation since we handle revalidation differently
      // There is 3 way we can handle revalidation:
      // 1. We could just let the revalidation go as normal, but due to race conditions the revalidation will be unreliable
      // 2. We could alter the lastModified time of our cache to make next believe that the cache is fresh, but this could cause issues with stale data since the cdn will cache the stale data as if it was fresh
      // 3. OUR CHOICE: We could pass a purpose prefetch header to the serverless function to make next believe that the request is a prefetch request and not trigger revalidation (This could potentially break in the future if next changes the behavior of prefetch requests)
      headers: {
        ...headers
      },
      body: preprocessedEvent.body,
      remoteAddress: preprocessedEvent.remoteAddress
    };
    const mergeHeadersPriority = globalThis.openNextConfig.dangerous?.headersAndCookiesPriority ? globalThis.openNextConfig.dangerous.headersAndCookiesPriority(preprocessedEvent) : "middleware";
    const store = globalThis.__openNextAls.getStore();
    if (store) {
      store.mergeHeadersPriority = mergeHeadersPriority;
    }
    const req = new IncomingMessage(reqProps);
    const res = createServerResponse(routingResult, overwrittenResponseHeaders, options?.streamCreator);
    await processRequest(req, res, routingResult);
    const { statusCode, headers: responseHeaders, isBase64Encoded, body } = convertRes(res);
    const internalResult = {
      type: internalEvent.type,
      statusCode,
      headers: responseHeaders,
      body,
      isBase64Encoded
    };
    return internalResult;
  });
}
async function processRequest(req, res, routingResult) {
  delete req.body;
  const initialURL = new URL(
    // We always assume that only the routing layer can set this header.
    routingResult.internalEvent.headers[INTERNAL_HEADER_INITIAL_URL] ?? routingResult.initialURL
  );
  let invokeStatus;
  if (routingResult.internalEvent.rawPath === "/500") {
    invokeStatus = 500;
  } else if (routingResult.internalEvent.rawPath === "/404") {
    invokeStatus = 404;
  }
  const requestMetadata = {
    isNextDataReq: routingResult.internalEvent.query.__nextDataReq === "1",
    initURL: routingResult.initialURL,
    initQuery: convertToQuery(initialURL.search),
    initProtocol: initialURL.protocol,
    defaultLocale: NextConfig.i18n?.defaultLocale,
    locale: routingResult.locale,
    middlewareInvoke: false,
    // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
    invokePath: routingResult.internalEvent.rawPath,
    invokeQuery: routingResult.internalEvent.query,
    // invokeStatus is only used for error pages
    invokeStatus
  };
  try {
    req.url = initialURL.pathname + convertToQueryString(routingResult.internalEvent.query);
    await requestHandler(requestMetadata)(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, requestMetadata);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function handleNoFallbackError(req, res, routingResult, metadata, index = 1) {
  if (index >= 5) {
    await tryRenderError("500", res, routingResult.internalEvent);
    return;
  }
  if (index >= routingResult.resolvedRoutes.length) {
    await tryRenderError("404", res, routingResult.internalEvent);
    return;
  }
  try {
    await requestHandler({
      ...routingResult,
      invokeOutput: routingResult.resolvedRoutes[index].route,
      ...metadata
    })(req, res);
  } catch (e) {
    if (e.constructor.name === "NoFallbackError") {
      await handleNoFallbackError(req, res, routingResult, metadata, index + 1);
    } else {
      error("NextJS request failed.", e);
      await tryRenderError("500", res, routingResult.internalEvent);
    }
  }
}
async function tryRenderError(type, res, internalEvent) {
  try {
    const _req = new IncomingMessage({
      method: "GET",
      url: `/${type}`,
      headers: internalEvent.headers,
      body: internalEvent.body,
      remoteAddress: internalEvent.remoteAddress
    });
    const requestMetadata = {
      // By setting invokePath and invokeQuery we can bypass some of the routing logic in Next.js
      invokePath: type === "404" ? "/404" : "/500",
      invokeStatus: type === "404" ? 404 : 500,
      middlewareInvoke: false
    };
    await requestHandler(requestMetadata)(_req, res);
  } catch (e) {
    error("NextJS request failed.", e);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      message: "Server failed to respond.",
      details: e
    }, null, 2));
  }
}

// node_modules/@opennextjs/aws/dist/core/resolve.js
async function resolveConverter(converter2) {
  if (typeof converter2 === "function") {
    return converter2();
  }
  const m_1 = await Promise.resolve().then(() => (init_edge(), edge_exports));
  return m_1.default;
}
async function resolveWrapper(wrapper) {
  if (typeof wrapper === "function") {
    return wrapper();
  }
  const m_1 = await Promise.resolve().then(() => (init_cloudflare_node(), cloudflare_node_exports));
  return m_1.default;
}
async function resolveTagCache(tagCache) {
  if (typeof tagCache === "function") {
    return tagCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy(), dummy_exports));
  return m_1.default;
}
async function resolveQueue(queue) {
  if (typeof queue === "function") {
    return queue();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy2(), dummy_exports2));
  return m_1.default;
}
async function resolveIncrementalCache(incrementalCache) {
  if (typeof incrementalCache === "function") {
    return incrementalCache();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy3(), dummy_exports3));
  return m_1.default;
}
async function resolveAssetResolver(assetResolver) {
  if (typeof assetResolver === "function") {
    return assetResolver();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy4(), dummy_exports4));
  return m_1.default;
}
async function resolveProxyRequest(proxyRequest) {
  if (typeof proxyRequest === "function") {
    return proxyRequest();
  }
  const m_1 = await Promise.resolve().then(() => (init_fetch(), fetch_exports));
  return m_1.default;
}
async function resolveCdnInvalidation(cdnInvalidation) {
  if (typeof cdnInvalidation === "function") {
    return cdnInvalidation();
  }
  const m_1 = await Promise.resolve().then(() => (init_dummy5(), dummy_exports5));
  return m_1.default;
}

// node_modules/@opennextjs/aws/dist/core/createMainHandler.js
async function createMainHandler() {
  const config = await import("./open-next.config.mjs").then((m) => m.default);
  const thisFunction = globalThis.fnName ? config.functions[globalThis.fnName] : config.default;
  globalThis.serverId = generateUniqueId();
  globalThis.openNextConfig = config;
  await globalThis.__next_route_preloader("start");
  globalThis.queue = await resolveQueue(thisFunction.override?.queue);
  globalThis.incrementalCache = await resolveIncrementalCache(thisFunction.override?.incrementalCache);
  globalThis.tagCache = await resolveTagCache(thisFunction.override?.tagCache);
  if (config.middleware?.external !== true) {
    globalThis.assetResolver = await resolveAssetResolver(globalThis.openNextConfig.middleware?.assetResolver);
  }
  globalThis.proxyExternalRequest = await resolveProxyRequest(thisFunction.override?.proxyExternalRequest);
  globalThis.cdnInvalidationHandler = await resolveCdnInvalidation(thisFunction.override?.cdnInvalidation);
  const converter2 = await resolveConverter(thisFunction.override?.converter);
  const { wrapper, name } = await resolveWrapper(thisFunction.override?.wrapper);
  debug("Using wrapper", name);
  return wrapper(openNextHandler, converter2);
}

// node_modules/@opennextjs/aws/dist/adapters/server-adapter.js
setNodeEnv();
setNextjsServerWorkingDirectory();
globalThis.internalFetch = fetch;
var handler2 = await createMainHandler();
function setNextjsServerWorkingDirectory() {
  process.chdir(__dirname);
}
export {
  handler2 as handler
};
