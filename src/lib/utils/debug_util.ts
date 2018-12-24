// util to map async method names

export default function extend(filename: string, async: any) {
  if (async._waterfall !== undefined) {
    return;
  }
  async._waterfall = async.waterfall;
  async.waterfall = (_tasks: any[], callback: any) => {
    const tasks = _tasks.map((t) => {
      const fn = (...args: any) => {
        console.log("async " + filename + ": " + t.name);
        t.apply(t, args);
      };
      return fn;
    });
    async._waterfall(tasks, callback);
  };
}
