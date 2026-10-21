// 预加载脚本：在隔离的渲染进程与主进程之间架一座安全的桥
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // 调用大模型（在主进程发起，无 CORS 问题）
  llmChat: (payload) => ipcRenderer.invoke('llm:chat', payload),
  // 用系统默认浏览器打开链接
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  // —— 流式大模型（「谈心」栏目）：返回 Promise<{ok, text} / {ok:false, error, aborted}> ——
  llmChatStream: (payload) => ipcRenderer.invoke('llm:chatStream', payload),
  // 订阅流式增量；返回取消订阅函数
  onLlmChunk: (cb) => {
    const handler = (_e, data) => { try { cb && cb(data); } catch (e) { /* 忽略 */ } };
    ipcRenderer.on('llm:chunk', handler);
    return () => ipcRenderer.removeListener('llm:chunk', handler);
  },
  // 叫停某次流式请求
  llmAbort: (reqId) => ipcRenderer.send('llm:abort', reqId),
  // —— 联网搜索（「谈心」栏目「联网找方法」）：免费多源，无需 Key ——
  webSearch: (query) => ipcRenderer.invoke('web:search', query)
});
