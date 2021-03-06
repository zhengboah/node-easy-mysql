const _ = require('underscore')
const co = require('co')
const mysql = require('mysql')
const Q = require('q')
const debug = require('debug')('node-easy-mysql')
const assert = require('assert')

let pool = null

class DB {
  constructor (options) {
    if (!pool) {
      this.dbConfig = _.extend({
        type: 'mysql',
        host: 'localhost',
        user: 'root',
        password: 'root',
        port: 3306,
        charset: 'utf8',
        database: '',
        connectionLimit: 10
      }, options) 
      this.pool = pool = mysql.createPool({
        connectionLimit: this.dbConfig.connectionLimit,
        host: this.dbConfig.host,
        user: this.dbConfig.user,
        password: this.dbConfig.password,
        database: this.dbConfig.database
      })
      debug("pool created")
    } else {
      this.pool = pool
    }
    this.reset()
  }

  alias (name) {
    this.$alias = name
    return this
  }

  startTrans () {
    const self = this
    return co(function * () {
      if (self.trans_connection) {
        return Promise.reject({msg: 'cannot start trans twice!'})
      }
      debug("Transaction start: ")
      let connection = yield Q.ninvoke(self.pool,'getConnection')
      self.trans_connection = connection
      yield Q.invoke(connection, 'beginTransaction')
    })
  } 
  
  commit () {
    const self = this
    return co(function * () {
      if (!self.trans_connection) {
        return Promise.reject({msg: 'No transaction now!'})
      }
      debug("Transaction commit")
      yield Q.ninvoke(self.trans_connection, 'commit')
      self.trans_connection.release()
      self.trans_connection = null
    }).catch((err) => {
      self.log(`commit error: ${err}`)
      return self.rollback()
    })
  }

  rollback () {
    const self = this
    return co(function * () {
      if (!self.trans_connection) {
        return Promise.reject({msg: 'No transaction now!'})
      }
      debug("Transaction rollback")
      yield Q.ninvoke(self.trans_connection, 'rollback')
      self.trans_connection.release()
      self.trans_connection = null
    })
  }

  reset () {
    this.$where = {}
    this.$join = ""
    this.$limit = ""
    this.$order = {}
    this.$field = null
    this.$table = ""
    this.$alias = null
    this.$isSql = false
  }

  table (table) {
    this.$table = table
    return this
  }

  where (where) {
    this.$where = _.extend(this.$where, where)
    return this
  }

  /**
   * ["a", ["b", "b1"]]
   * @param {*} field 
   */
  field (field = []) {
    if (_.isString(field)) {
       this.$field = field
       return this
    }
    if (_.isEmpty(field)) {
      return this
    }  
    let str = ""  
    _.each(field, (value, key) => {
      if (_.isArray(value)) {
        str += `\`${value[0].replace(/\./g, '`.`')}\` as ${value[1]},`
      } else if (_.isString(value)){
        str += `\`${value.replace(/\./g, '`.`')}\`,`
      }
    })
    this.$field = str.slice(0, -1)
    return this
  }

  limit (size = 10, offset = 0) {
    if (_.isString(size)) {
      this.$limit = `LIMIT ${size}`
      return this
    }
    if (_.isNumber(size)) {
      size = mysql.escape(size)
      if (_.isNumber(offset)) {
        offset = mysql.escape(offset)
        this.$limit = `LIMIT ${offset},${size}`
      } else {
        this.$limit = `LIMIT ${size}`
      }
      return this
    }
    return this
  }

  query (query, data = []) {
    const self = this
    let isSql = self.$isSql
    self.reset()
    if (isSql) {
      let formatSql = mysql.format(query, data)
      return Promise.resolve(formatSql)
    }

    return co(function * (){
      let connection
      if (self.trans_connection) { //transaction
        connection = self.trans_connection
      } else {
        connection = yield Q.ninvoke(self.pool,'getConnection')
      }
      self.log(mysql.format(query, data))
      let result = yield Q.ninvoke(connection, 'query', query, data)
      if (!self.trans_connection) connection.release() 
      return result[0]
    })
  }

  fetchSql (isSql) {
    if (isSql) {
      this.$isSql = true
    }
    return this
  }

  join (joinSql = "") {
    this.$join += joinSql
    return this 
  }

  find () {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      self.$limit = "LIMIT 1"
      result =  yield self.select()
      if (isSql) {
        return result
      }
      if (_.isArray(result) && result.length) {
        return result[0]
      }
      return null
    })
  }

  select () {
    let field = this.$field || "*"
    let datas = []
    
    let sql = `SELECT ${field} FROM \`${this.$table}\``
    if (this.$alias) {
      sql += ` ${this.$alias}`
    }
    if (!_.isEmpty(this.$join)) {
      sql += ` ${this.$join}`
    }
    if (!_.isEmpty(this.$where)) {
      let parseWhere = this.parseWhere(this.$where)
      datas = datas.concat(parseWhere[1])
      sql += ` WHERE ${parseWhere[0]}`
    }
    if(this.$limit.length) {
      sql += ` ${this.$limit}`
    }

    return this.query(sql, datas)
  }

  max (field) {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      let fieldName = '_field'
      self.$field = `MAX(${mysql.escapeId(field)}) as ${fieldName}`
      result = yield self.select()
      if (isSql) {
        return result
      }
      if (!result.length) {
        return null
      }
      return result[0][fieldName]
    })
  }

  min (field) {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      let fieldName = '_field'
      self.$field = `MIN(${mysql.escapeId(field)}) as ${fieldName}`
      result = yield self.select()
      if (isSql) {
        return result
      }
      if (!result.length) {
        return null
      }
      return result[0][fieldName]
    })
  }

  count (field) {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      let fieldName = '_field'
      self.$field = `COUNT(${mysql.escapeId(field)}) as ${fieldName}`
      result = yield self.select()
      if (isSql) {
        return result
      }
      if (!result.length) {
        return null
      }
      return result[0][fieldName]
    })
  }

  sum (field) {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      let fieldName = '_field'
      self.$field = `SUM(${mysql.escapeId(field)}) as ${fieldName}`
      result = yield self.select()
      if (isSql) {
        return result
      }
      if (!result.length) {
        return null
      }
      return result[0][fieldName]
    })
  }

  avg (field) {
    const self = this
    return co(function * () {
      let result
      let isSql = self.$isSql
      let fieldName = '_field'
      self.$field = `AVG(${mysql.escapeId(field)}) as ${fieldName}`
      result = yield self.select()
      if (isSql) {
        return result
      }
      if (!result.length) {
        return null
      }
      return result[0][fieldName]
    })
  }

  insert (data) {
    let column = []
    let columnDatas = []
    let values = []
    let datas = []
    _.each(data, (value, key) => {
      column.push("??")
      values.push("?")
      columnDatas.push(key)
      datas.push(value)
    })
    let query = `INSERT INTO \`${this.$table}\`(${column.join(',')}) VALUES(${values.join(',')})`
    return this.query(query, columnDatas.concat(datas))
  }

  add (data) {
    return this.insert(data)
  }
  
  update (data = {}) {
    assert(!_.isEmpty(this.$where), "where must not be empty")
    assert(!_.isEmpty(data), "data must not be empty")
    let setSql = "" 
    let datas = []
    _.each(data, (value, key) => {
      setSql += "??=?,"
      datas.push(key, value)
    })
    setSql = setSql.slice(0, -1)
    let parseWhere = this.parseWhere(this.$where)
    let query = `UPDATE \`${this.$table}\` set ${setSql} WHERE ${parseWhere[0]}`
    datas = datas.concat(parseWhere[1])
    return this.query(query, datas)
  }

  delete (where = {}) {
    this.$where = _.extend(this.$where, where)
    assert(!_.isEmpty(this.$where), "where must not be empty")
    let parseWhere = this.parseWhere(this.$where)
    let query = `DELETE FROM \`${this.$table}\` where ${parseWhere[0]}`
    return this.query(query, parseWhere[1])
  }

  parseWhere (where) {
    if (_.isEmpty(where)) {
      return ["", []]
    }
    let datas = []
    let whereSql = ""
    _.each(where, (value, key) => {
      whereSql += " AND ??=?"
      datas.push(key, value)
    })
    whereSql = whereSql.slice(4)
    return [whereSql, datas]
  }
  
  log (info) {
    info = `node-easy-mysql >> ${info}`
    if (!this.dbConfig.log) {
      console.log(info)
    } else {
      this.dbConfig.log(info)
    }
  }

}

module.exports = DB