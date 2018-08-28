class EmptySourceMap {
  static createRelativeTo(sourceMapString) {
    if(sourceMapString == '') return EmptySourceMap;

    return new SourceMap(sourceMapString);
  }

  static toString() {
    return '';
  }
}

class SourceMap {
  constructor(sourceMapStringOrOffset, length, id, jump) {
    if(typeof sourceMapStringOrOffset == 'string') {
      let [offset, length, id, jump] = sourceMapStringOrOffset.split(":");

      this.offset = parseInt(offset, 10);
      this.length = parseInt(length, 10);

      if(id) this.id = parseInt(id, 10);
      this.jump = jump;
    } else {
      this.offset = sourceMapStringOrOffset;
      this.length = length;
      this.id = id;
      this.jump = jump;
    }
  }

  createRelativeTo(sourceMapString) {
    if(sourceMapString == '' || sourceMapString == undefined) return EmptySourceMap;

    let [offset, length, id, jump] = sourceMapString.split(":");

    offset = (offset == '') ? this.offset : parseInt(offset, 10);
    id = (id == '' || id == undefined) ? this.id : parseInt(id, 10);
    length = parseInt(length, 10);

    return new SourceMap(offset, length, id, jump);
  }

  subtract(sourceMap) {
    return new SourceMap(this.offset, sourceMap.offset - this.offset, this.id, this.jump);
  }

  toString(defaultId) {
    let parts = [this.offset, this.length];

    if(this.id !== undefined && this.id != '') {
      parts.push(this.id);
    } else if(defaultId !== undefined) {
      parts.push(defaultId);
    }

    return parts.join(':');
  }

  static empty() {
    return EmptySourceMap;
  }
}

module.exports = SourceMap;
