class SourceMap {
  constructor(sourceMapStringOrOffset, length, id) {
    if(typeof sourceMapStringOrOffset == 'string') {
      let [offset, length, id, ..._rest] = sourceMapStringOrOffset.split(":");

      this.offset = parseInt(offset, 10);
      this.length = parseInt(length, 10);

      if(id) this.id = parseInt(id, 10);
    } else {
      this.offset = sourceMapStringOrOffset;
      this.length = length;
      this.id = id;
    }
  }

  subtract(sourceMap) {
    return new SourceMap(this.offset, sourceMap.offset - this.offset);
  }

  toString() {
    var parts = [this.offset, this.length];
    if(this.id) parts.push(this.id);

    return parts.join(':');
  }
}

module.exports = SourceMap;
