# node-easy-mysql



## Installation
```
npm install node-easy-mysql
```

## Usage
```
const Db = require('node-easy-mysql')
const co = require('co')

const dbInstance = new Db({
  host:   'localhost', 
  user:   'root',
  password: 'root',
  database: 'mydb'
})

co(function * () {
  // add account
 yield dbInstance.table('account').insert({
    email: 'test@111.com',
    password: '8*********sdfsdfsd',
    name: '"test"',
    tel: 333333333,
  })

  // modify account
  yield dbInstance.table('account').where({account: 'ttteeet@jjjj3.com', status: 2}).update({name: 'dddddd', group_id: 33, permission: 111})

  // delete account
  yield dbInstance.table('account').where({account: 'test@111.com'}).delete()

  yield dbInstance.table('account').field(['a.email', ['b.org_id', 'dddd']]).alias('a').join('left join zy_account_group b on a.group_id=b.id').limit(1).select()


  yield dbInstance.table('account').where({permission: 111}).find()


  result = yield dbInstance.table('account').where({pwd: '222222'}).sum('id')
  result = yield dbInstance.table('account').where({pwd: '222222'}).min('id')
  result = yield dbInstance.table('account').where({pwd: '222222'}).max('id')
  result = yield dbInstance.table('account').where({pwd: '222222'}).avg('id')
  result = yield dbInstance.table('account').where({pwd: '222222'}).count('id')

  // transaction mode
  yield dbInstance.startTrans()
  yield dbInstance.table('account1').add({account:'33333', pwd: '22222222222'})
  yield dbInstance.table('account1').select()
  yield dbInstance.commit()

}).catch((err) => {
  console.log(err)
})

```