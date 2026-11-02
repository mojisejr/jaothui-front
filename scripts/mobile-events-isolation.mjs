/** Local integration guard, independent of runtime feature flags. Never broaden this target. */
export function requireEventTestTarget(env) {
  if (env.JAOTHUI_EVENT_SANITY_PROJECT_ID !== "q38mtihr" || env.JAOTHUI_EVENT_SANITY_DATASET !== "dev" || !env.JAOTHUI_EVENT_SANITY_WRITE_TOKEN) throw new Error("Integration writes require explicit q38mtihr/dev credentials; production/missing/other targets are forbidden");
}
export function guardOwnedEventClient(client, ownedIds, baselineIds, beforeMutation = () => {}) {
  const assertOwned = id => {
    if (typeof id !== "string" || !ownedIds.has(id) || baselineIds.has(id)) throw new Error("Foreign/existing mutation ID refused");
    beforeMutation();
  };
  const guarded = new Proxy(client, { get(target, key) {
    if (["delete", "mutate", "createOrReplace"].includes(key)) return () => { throw new Error("Bulk/delete/replace mutations forbidden"); };
    if (key === "create" || key === "createIfNotExists") return (doc, ...args) => { assertOwned(doc?._id); return target[key](doc, ...args); };
    if (key === "patch") return (id, ...args) => { assertOwned(id); return target.patch(id, ...args); };
    if (key === "transaction") return () => {
      const raw = target.transaction(); let proxy;
      proxy = new Proxy(raw, { get(tx, method) {
        if (["delete", "createOrReplace"].includes(method)) return () => { throw new Error("Delete/replace forbidden"); };
        if (["create", "createIfNotExists"].includes(method)) return doc => { assertOwned(doc?._id); tx[method](doc); return proxy; };
        if (method === "patch") return (id, patch) => { assertOwned(id); tx.patch(id, patch); return proxy; };
        if (method === "commit") return (...args) => { beforeMutation(); return tx.commit(...args); };
        const value=tx[method];return typeof value === "function" ? value.bind(tx) : value;
      }});return proxy;
    };
    if (key === "assets") return new Proxy(target.assets,{get(assets,method){
      if(method==="upload")return async(kind,bytes,...args)=>{
        const {applicantImageIdentity}=await import("../server/mobile/events/image.ts");
        if(kind!=="image")throw new Error("Only owned synthetic images permitted");assertOwned(applicantImageIdentity(bytes).id);return assets.upload(kind,bytes,...args);
      };
      const value=assets[method];return typeof value === "function" ? value.bind(assets):value;
    }});
    const value=target[key];return typeof value === "function" ? value.bind(target) : value;
  }});
  return guarded;
}
