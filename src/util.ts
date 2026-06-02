export async function runPool(items: any[], workerFn: any, concurrency: number = 8) {
  let index = 0

  async function worker(workerId: number) {
    while (true) {
      const i = index++

      if (i >= items.length) {
        return
      }

      await workerFn(items[i], workerId, i + 1)
    }
  }

  await Promise.all(Array.from({length: concurrency}, (_, i) => worker(i + 1)))
}
