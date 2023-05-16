export abstract class Cache {
  protected static instance: Cache

  protected constructor() {
    this.cacheData = new Map()
  }

  // public static async getInstance(): Promise<Cache> {
  //     if (!Cache.instance) {
  //         Cache.instance = new Cache()
  //     }
  //     return Cache.instance
  // };

  private cacheData: Map<string, any>

  public resetCache() {
    this.cacheData = new Map()
  }

  public getCacheLength(): number {
    return this.cacheData.size
  }

  public setCacheObject(data: any, key: string) {
    this.cacheData.set(key, data)
  }

  public safeSetCacheObject(data: any, key: string) {
    if (this.cacheData.has(key)) {
      throw new Error("Cache object already existed")
    }
    this.cacheData.set(key, data)
  }

  public getCacheObject(key: string) {
    return this.cacheData.get(key)
  }

  public safeGetCacheObject<T>(key: string): T {
    let data
    try {
      data = this.cacheData.get(key) as T
    } catch (e) {
      console.log(e)
    }
    if (!data) {
      throw new Error("Value is empty")
    }
    return data
  }

  public removeDataMultiCache(keys: string[]) {
    for (let index = 0; index < keys.length; index++) {
      const element = keys[index]
      this.removeDataCache(element)
    }
  }

  public removeDataCache(key: string) {
    this.cacheData.set(key, undefined)
  }
}
