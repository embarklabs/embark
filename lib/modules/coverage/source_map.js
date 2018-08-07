class SourceMap {
  constructor(sourceMapStringOrOffset, length, id) {
    if(typeof sourceMapStringOrOffset == 'string') {
      var [offset, length, id, ..._rest] = sourceMapStringOrOffset.split(":");

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
    var length = sourceMap.offset - this.offset;
    return new SourceMap(this.offset, length);
  }

  toString() {
    var parts = [this.offset, this.length];
    if(this.id) parts.push(this.id);

    return parts.join(':');
  }
}

module.exports = SourceMap;
