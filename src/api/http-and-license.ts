  var mge = j4(pge, { path: '/' })
  const vge = 'Admin-Token'
  function gge() {
    return mge.get(vge)
  }
  Za.defaults.timeout = 5e3
  Za.defaults.withCredentials = !0
  Za.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
  Za.defaults.baseURL = 'http://123.56.239.118:9001'
  Za.interceptors.response.use(
    (t) => (
      (t.data.code || 200) == 401 &&
        (window.location.href =
          window.location.protocol + '//' + window.location.hostname + ':5018/login'),
      t.request.responseType === 'blob' || t.request.responseType === 'arraybuffer'
        ? t.data
        : t.status == 200
          ? Promise.resolve(t)
          : Promise.reject(t)
    ),
    (t) => {
      if (t.response.status) {
        switch (t.response.status) {
          case 401:
            window.location.href =
              window.location.protocol + '//' + window.location.hostname + ':81/login'
            break
        }
        return Promise.reject(t.response)
      }
    }
  )
  function yge(t, e) {
    return new Promise((n, u) => {
      Za.post(t, e, { headers: { Authorization: 'Bearer ' + gge() } })
        .then((r) => {
          n(r.data)
        })
        .catch((r) => {
          u(r)
        })
    })
  }
