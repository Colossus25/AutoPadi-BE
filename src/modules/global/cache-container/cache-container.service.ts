// import { SystemCache } from "@/definitions";
// import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
// import { Inject, Injectable } from "@nestjs/common";

// @Injectable()
// export class CacheService {
//   constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

//   async get<T>(key: string) {
//     return await this.cacheManager.get<T>(key);
//   }

//   set(key: string, value: unknown, ttl?: number) {
//     this.cacheManager.set(key, value, ttl); //ttl not working
//   }

//   del(key: string) {
//     this.cacheManager.del(key);
//   }

//   clear() {
//     this.cacheManager.reset();
//   }

//   async getUserPermissions(userId: number) {
//     return await this.get<Permissions[]>(
//       `_${userId}_${SystemCache.USER_PERMISSIONS}`
//     );
//   }

//   setUserPermissions(
//     userId: number,
//     permissions: Permissions[],
//     ttl?: number
//   ) {
//     this.cacheManager.set(
//       `_${userId}_${SystemCache.USER_PERMISSIONS}`,
//       permissions,
//       ttl
//     );
//   }
// }
