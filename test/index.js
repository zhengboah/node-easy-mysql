const assert = require('assert')
const co = require('co')
const Db = require('../index.js')

/**
 * 配置数据库
 */
const dbInstance = new Db({
  host:   'localhost', 
  user:   'root',
  password: 'root',
  database: 'node_easy_mysql'
})

/**
 * TODO
 */
describe('test', function () {
  before(function () {
    return co(function * () {
      yield dbInstance.query("CREATE TABLE IF NOT EXISTS `account` (`username` varchar(50) DEFAULT NULL,`password` char(40) DEFAULT NULL) ENGINE=InnoDB")
    })
  })

  // add 
  it('add/insert', function () {
    return co(function * () {
      yield dbInstance.table('account').add({
        username: "test",
        password: "password"
      })
      let account = yield dbInstance.table('account').where({username: 'test'}).find()
      if (!account) {
        return Promise.reject()
      }
      yield dbInstance.table('account').where({username: 'test'}).delete() 
    })
  })

  // modify
  it('modify', function () {
    return co(function * () {
      yield dbInstance.table('account').add({
        username: "test",
        password: "password"
      })
      yield dbInstance.table('account').where({username: 'test'}).update({
        password: "new_password"
      })
      let account = yield dbInstance.table('account').where({username: 'test'}).find()
      console.log(account)
      if (!account || (account.password != "new_password")) {
        return Promise.reject()
      } 
      yield dbInstance.table('account').where({username: 'test'}).delete()
    })
  })


})