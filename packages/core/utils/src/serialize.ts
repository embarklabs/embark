export function Serializable(target: any) {
  target.prototype.toJSON = function() {
    const props = Object.getOwnPropertyDescriptors(this);
    const map = {};
    Object.entries(props).map(([name, prop]) => {
      if (Serialization.isIgnored(target.prototype, name)) {
        return;
      }
      map[name] = prop.value;
    });
    return map;
  };
}

export function Ignore(target: any, propertyKey: string) {
  Serialization.registerIgnore(target, propertyKey);
}

class Serialization {
  private static ignoreMap: Map<any, string[]> = new Map();
  static registerIgnore(target: any, property: any): void {
    let keys = this.ignoreMap.get(target);
    if (!keys) {
      keys = [];
      this.ignoreMap.set(target, keys);
    }
    keys.push(property);
  }

  static isIgnored(target: any, property: any): boolean {
    const keys = this.ignoreMap.get(target);
    if (!keys) {
      return false;
    }
    return keys.includes(property);
  }
}
