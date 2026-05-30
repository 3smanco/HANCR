"use strict";exports.id=710,exports.ids=[710],exports.modules={94019:(e,t,n)=>{n.d(t,{Z:()=>i});let i=(0,n(62881).Z)("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]])},44642:(e,t,n)=>{n.d(t,{W:()=>l});var i=n(10326),r=n(17577),a=n(98485),s=n(32933),o=n(70773),d=n(16358);function l(){let{locale:e,setLocale:t}=(0,o.bU)(),[n,l]=(0,r.useState)(!1),c=(0,r.useRef)(null),u=d.RF.find(t=>t.code===e),m=e=>{t(e),l(!1)};return(0,i.jsxs)("div",{className:"relative",ref:c,children:[(0,i.jsxs)("button",{onClick:()=>l(!n),className:"inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors","aria-label":"Change language",children:[i.jsx(a.Z,{className:"w-4 h-4"}),i.jsx("span",{className:"text-sm font-bold",children:u.flag}),i.jsx("span",{className:"text-xs font-bold uppercase",children:u.code})]}),n&&i.jsx("div",{className:"absolute end-0 mt-2 w-48 card p-1.5 animate-fade-in z-50",style:{minWidth:"12rem"},children:d.RF.map(t=>{let n=t.code===e;return(0,i.jsxs)("button",{onClick:()=>m(t.code),className:`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors ${n?"bg-hancr-violet-light text-hancr-violet-deep font-bold":"text-gray-700 hover:bg-gray-50"}`,children:[i.jsx("span",{className:"text-lg",children:t.flag}),i.jsx("span",{className:"flex-1 text-start",children:t.label}),n&&i.jsx(s.Z,{className:"w-4 h-4"})]},t.code)})})]})}},63944:(e,t,n)=>{n.d(t,{Z:()=>d});var i=n(10326),r=n(6507),a=n(66591),s=n(51223),o=n(44642);function d({title:e,subtitle:t}){let n=(0,a.t)(e=>e.admin);return(0,i.jsxs)("header",{className:"flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200",children:[(0,i.jsxs)("div",{className:"min-w-0",children:[i.jsx("h1",{className:"text-lg font-extrabold text-gray-900 truncate",children:e}),t&&i.jsx("p",{className:"text-sm text-gray-500 mt-0.5 truncate",children:t})]}),(0,i.jsxs)("div",{className:"flex items-center gap-3 shrink-0",children:[i.jsx(o.W,{}),(0,i.jsxs)("button",{className:"relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors",children:[i.jsx(r.Z,{className:"w-5 h-5 text-gray-600"}),i.jsx("span",{className:"absolute top-1.5 end-1.5 w-2 h-2 bg-hancr-violet rounded-full ring-2 ring-white"})]}),(0,i.jsxs)("div",{className:"flex items-center gap-2 ps-3 border-s border-gray-200",children:[i.jsx("div",{className:"flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet",children:i.jsx("span",{className:"text-xs font-extrabold text-white",children:n?(0,s.Qm)(n.email):"A"})}),(0,i.jsxs)("div",{className:"hidden sm:block",children:[i.jsx("p",{className:"text-sm font-bold text-gray-900 leading-tight max-w-[140px] truncate",children:n?.email??"Admin"}),i.jsx("p",{className:"text-xs text-gray-400 capitalize",children:n?.role??"admin"})]})]})]})]})}},79704:(e,t,n)=>{n.d(t,{$c:()=>h,AO:()=>d,Ee:()=>S,FF:()=>N,HF:()=>r,K3:()=>l,MU:()=>$,QX:()=>y,TQ:()=>c,U9:()=>a,UU:()=>s,Uw:()=>m,Zc:()=>o,_G:()=>x,kC:()=>g,ku:()=>b,lG:()=>I,qi:()=>v,r1:()=>f,s:()=>u,x3:()=>p});var i=n(24293);let r=(0,i.Ps)`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      accessToken
      email
      role
    }
  }
`,a=(0,i.Ps)`
  query DashboardStats {
    dashboardStats {
      totalRiders
      totalDrivers
      activeDrivers
      pendingDriverApprovals
      totalOrders
      completedOrders
      canceledOrders
      totalRevenue
      platformRevenue
    }
  }
`,s=(0,i.Ps)`
  query RevenueStats($days: Int!) {
    revenueStats(days: $days) {
      date
      orderCount
      revenue
      platformRevenue
    }
  }
`,o=(0,i.Ps)`
  query AdminListRiders($page: Int!, $limit: Int!) {
    adminListRiders(page: $page, limit: $limit) {
      items {
        id
        firstName
        lastName
        phoneNumber
        email
        rating
        totalRides
        balance
        currency
        active
        banned
        createdAt
      }
      total
      page
      limit
    }
  }
`,d=(0,i.Ps)`
  mutation BanRider($id: Int!, $reason: String!) {
    banRider(id: $id, reason: $reason) {
      id
      banned
    }
  }
`,l=(0,i.Ps)`
  mutation UnbanRider($id: Int!) {
    unbanRider(id: $id) {
      id
      banned
    }
  }
`,c=(0,i.Ps)`
  query AdminListDrivers($page: Int!, $limit: Int!, $pendingOnly: Boolean) {
    adminListDrivers(page: $page, limit: $limit, pendingOnly: $pendingOnly) {
      items {
        id
        firstName
        lastName
        phoneNumber
        status
        rating
        ratingCount
        balance
        currency
        active
        banned
        carBrand
        carModel
        carYear
        carColor
        plateNumber
        createdAt
      }
      total
      page
      limit
    }
  }
`,u=(0,i.Ps)`
  mutation ApproveDriver($id: Int!) {
    approveDriver(id: $id) {
      id
      active
    }
  }
`,m=(0,i.Ps)`
  mutation BanDriver($id: Int!) {
    banDriver(id: $id) {
      id
      banned
    }
  }
`,g=(0,i.Ps)`
  mutation UnbanDriver($id: Int!) {
    unbanDriver(id: $id) {
      id
      banned
    }
  }
`,p=(0,i.Ps)`
  query AdminOrders($page: Int!, $limit: Int!, $status: String) {
    adminOrders(page: $page, limit: $limit, status: $status) {
      items {
        id
        status
        type
        serviceName
        regionName
        costBest
        costAfterCoupon
        paidAmount
        currency
        distanceBest
        durationBest
        paymentMode
        riderId
        riderPhone
        driverId
        driverPhone
        createdOn
        finishTimestamp
      }
      total
      page
      limit
    }
  }
`,f=(0,i.Ps)`
  mutation ForceCancel($id: Int!) {
    forceCancel(id: $id) {
      id
      status
    }
  }
`,v=(0,i.Ps)`
  query AdminRegions {
    adminRegions {
      id
      name
      nameEn
      currency
      enabled
      bidModeEnabled
      defaultSearchRadius
    }
  }
`,h=(0,i.Ps)`
  mutation ToggleRegionEnabled($id: Int!) {
    toggleRegionEnabled(id: $id) {
      id
      enabled
    }
  }
`,b=(0,i.Ps)`
  query AdminServices($regionId: Int) {
    adminServices(regionId: $regionId) {
      id
      name
      nameEn
      serviceType
      regionId
      baseFare
      perHundredMeters
      perMinuteDrive
      minimumFee
      providerSharePercent
      bidModeEnabled
      enabled
      displayOrder
      isVip
      searchRadius
    }
  }
`,x=(0,i.Ps)`
  mutation ToggleServiceEnabled($id: Int!) {
    toggleServiceEnabled(id: $id) {
      id
      enabled
    }
  }
`,y=(0,i.Ps)`
  query AppConfig($configKey: String!) {
    appConfig(configKey: $configKey) {
      id
      configKey
      version
      themeConfig
      homeScreenConfig
      featureFlags
      loyaltyConfig
      updatedAt
    }
  }
`;(0,i.Ps)`
  query AppConfigs {
    appConfigs {
      id
      configKey
      version
      updatedAt
    }
  }
`;let $=(0,i.Ps)`
  mutation UpdateAppConfig($configKey: String!, $input: UpdateAppConfigInput!) {
    updateAppConfig(configKey: $configKey, input: $input) {
      id
      configKey
      featureFlags
      themeConfig
      homeScreenConfig
      loyaltyConfig
      updatedAt
    }
  }
`,I=(0,i.Ps)`
  query SosIncidents($statuses: [SosStatus!], $limit: Int = 50, $offset: Int = 0) {
    sosIncidents(statuses: $statuses, limit: $limit, offset: $offset) {
      id
      triggeredBy
      triggeredById
      orderId
      latitude
      longitude
      lastLatitude
      lastLongitude
      status
      adminNote
      contactsNotified
      policeNotified
      createdAt
      resolvedAt
    }
    activeSosCount
  }
`,N=(0,i.Ps)`
  mutation ResolveSos($input: ResolveSosInput!) {
    resolveSosIncident(input: $input) {
      id
      status
      adminNote
      resolvedAt
    }
  }
`,S=(0,i.Ps)`
  mutation EscalateSos($incidentId: Int!, $adminNote: String!) {
    escalateSosIncident(incidentId: $incidentId, adminNote: $adminNote) {
      id
      status
      adminNote
      policeNotified
    }
  }
`},51223:(e,t,n)=>{n.d(t,{Qm:()=>l,cn:()=>a,p6:()=>d,uf:()=>s,xG:()=>o});var i=n(41135),r=n(31009);function a(...e){return(0,r.m6)((0,i.W)(e))}function s(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toString()}function o(e,t="SAR"){return new Intl.NumberFormat("ar-SA",{style:"currency",currency:t,minimumFractionDigits:2}).format(e)}function d(e){return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(e))}function l(e){return e.split(" ").slice(0,2).map(e=>e[0]?.toUpperCase()??"").join("")}},18753:(e,t,n)=>{n.d(t,{D:()=>m});var i=n(65826),r=n(66126),a=n(34837),s=n(20208),o=n(76049),d=n(17267),l=n(88571),c=n(51047).Nq?r.useLayoutEffect:r.useEffect,u=n(46127);function m(e,t){!1!==globalThis.__DEV__&&(0,u.G)(t||{},"ignoreResults","useMutation","If you don't want to synchronize component state with the mutation, please use the `useApolloClient` hook to get the client instance and call `client.mutate` directly.");var n=(0,l.x)(null==t?void 0:t.client);(0,o.Vp)(e,o.n_.Mutation);var m=r.useState({called:!1,loading:!1,client:n}),g=m[0],p=m[1],f=r.useRef({result:g,mutationId:0,isMounted:!0,client:n,mutation:e,options:t});c(function(){Object.assign(f.current,{client:n,options:t,mutation:e})});var v=r.useCallback(function(e){void 0===e&&(e={});var t=f.current,n=t.options,r=t.mutation,o=(0,i.pi)((0,i.pi)({},n),{mutation:r}),l=e.client||f.current.client;f.current.result.loading||o.ignoreResults||!f.current.isMounted||p(f.current.result={loading:!0,error:void 0,data:void 0,called:!0,client:l});var c=++f.current.mutationId,u=(0,a.J)(o,e);return l.mutate(u).then(function(t){var n,i,r=t.data,a=t.errors,o=a&&a.length>0?new d.cA({graphQLErrors:a}):void 0,m=e.onError||(null===(n=f.current.options)||void 0===n?void 0:n.onError);if(o&&m&&m(o,u),c===f.current.mutationId&&!u.ignoreResults){var g={called:!0,loading:!1,data:r,error:o,client:l};f.current.isMounted&&!(0,s.D)(f.current.result,g)&&p(f.current.result=g)}var v=e.onCompleted||(null===(i=f.current.options)||void 0===i?void 0:i.onCompleted);return o||null==v||v(t.data,u),t},function(t){if(c===f.current.mutationId&&f.current.isMounted){var n,i={loading:!1,error:t,data:void 0,called:!0,client:l};(0,s.D)(f.current.result,i)||p(f.current.result=i)}var r=e.onError||(null===(n=f.current.options)||void 0===n?void 0:n.onError);if(r)return r(t,u),{data:void 0,errors:t};throw t})},[]),h=r.useCallback(function(){if(f.current.isMounted){var e={called:!1,loading:!1,client:f.current.client};Object.assign(f.current,{mutationId:0,result:e}),p(e)}},[]);return r.useEffect(function(){var e=f.current;return e.isMounted=!0,function(){e.isMounted=!1}},[]),[v,(0,i.pi)({reset:h},g)]}}};