exports.id=425,exports.ids=[425],exports.modules={48941:(e,t,i)=>{Promise.resolve().then(i.bind(i,17676))},1572:(e,t,i)=>{"use strict";i.d(t,{Z:()=>a});let a=(0,i(62881).Z)("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]])},44642:(e,t,i)=>{"use strict";i.d(t,{W:()=>l});var a=i(10326),r=i(17577),n=i(98485),s=i(32933),d=i(70773),o=i(16358);function l(){let{locale:e,setLocale:t}=(0,d.bU)(),[i,l]=(0,r.useState)(!1),c=(0,r.useRef)(null),m=o.RF.find(t=>t.code===e),u=e=>{t(e),l(!1)};return(0,a.jsxs)("div",{className:"relative",ref:c,children:[(0,a.jsxs)("button",{onClick:()=>l(!i),className:"inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors","aria-label":"Change language",children:[a.jsx(n.Z,{className:"w-4 h-4"}),a.jsx("span",{className:"text-sm font-bold",children:m.flag}),a.jsx("span",{className:"text-xs font-bold uppercase",children:m.code})]}),i&&a.jsx("div",{className:"absolute end-0 mt-2 w-48 card p-1.5 animate-fade-in z-50",style:{minWidth:"12rem"},children:o.RF.map(t=>{let i=t.code===e;return(0,a.jsxs)("button",{onClick:()=>u(t.code),className:`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors ${i?"bg-hancr-violet-light text-hancr-violet-deep font-bold":"text-gray-700 hover:bg-gray-50"}`,children:[a.jsx("span",{className:"text-lg",children:t.flag}),a.jsx("span",{className:"flex-1 text-start",children:t.label}),i&&a.jsx(s.Z,{className:"w-4 h-4"})]},t.code)})})]})}},17676:(e,t,i)=>{"use strict";i.d(t,{Sidebar:()=>N});var a=i(10326),r=i(90434),n=i(35047),s=i(24319),d=i(81536),o=i(24061),l=i(34565),c=i(15601),m=i(88378),u=i(77636),g=i(3634),p=i(66184),h=i(6507),x=i(39183),f=i(71810),b=i(51223),v=i(66591),y=i(70773),$=i(40381);function N(){let e=(0,y.NT)(),t=(0,n.usePathname)(),i=(0,n.useRouter)(),N=(0,v.t)(e=>e.logout),j=[{key:"nav.dashboard",icon:s.Z,href:"/dashboard"},{key:"nav.drivers",icon:d.Z,href:"/users/drivers"},{key:"nav.riders",icon:o.Z,href:"/users/riders"},{key:"nav.orders",icon:l.Z,href:"/orders"},{key:"nav.sos",icon:c.Z,href:"/sos"},{key:"nav.services",icon:m.Z,href:"/services"},{key:"nav.regions",icon:u.Z,href:"/regions"},{key:"nav.features",icon:g.Z,href:"/features"},{key:"nav.analytics",icon:p.Z,href:"/analytics"},{key:"nav.notifications",icon:h.Z,href:"/settings"}];return(0,a.jsxs)("aside",{className:"flex flex-col w-60 h-screen bg-hancr-navy border-e border-sidebar-border shrink-0",children:[(0,a.jsxs)("div",{className:"flex items-center gap-3 px-5 py-5 border-b border-sidebar-border",children:[a.jsx("div",{className:"flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet",children:a.jsx("span",{className:"text-lg font-extrabold text-white",children:"H"})}),(0,a.jsxs)("div",{children:[a.jsx("p",{className:"text-white font-extrabold text-sm leading-tight",children:e("brand.name")}),a.jsx("p",{className:"text-sidebar-muted text-xs",children:e("brand.tagline")})]})]}),a.jsx("nav",{className:"flex-1 py-4 overflow-y-auto",children:a.jsx("div",{className:"px-3 space-y-0.5",children:j.map(i=>{let n=t===i.href||"/dashboard"!==i.href&&t.startsWith(i.href);return(0,a.jsxs)(r.default,{href:i.href,className:(0,b.cn)("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150",n?"sidebar-item-active":"text-sidebar-muted hover:text-white hover:bg-white/5"),children:[a.jsx(i.icon,{className:"w-4.5 h-4.5 shrink-0",strokeWidth:n?2.5:2}),a.jsx("span",{className:"flex-1",children:e(i.key)}),n&&a.jsx(x.Z,{className:"w-3.5 h-3.5 text-hancr-violet opacity-80 rtl:rotate-180"})]},i.href)})})}),a.jsx("div",{className:"px-3 py-4 border-t border-sidebar-border",children:(0,a.jsxs)("button",{onClick:()=>{N(),$.ZP.success(e("auth.signedOut")),i.push("/login")},className:"flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-bold text-sidebar-muted hover:text-white hover:bg-red-500/10 transition-all",children:[a.jsx(f.Z,{className:"w-4.5 h-4.5 shrink-0"}),a.jsx("span",{children:e("auth.logout")})]})})]})}},63944:(e,t,i)=>{"use strict";i.d(t,{Z:()=>o});var a=i(10326),r=i(6507),n=i(66591),s=i(51223),d=i(44642);function o({title:e,subtitle:t}){let i=(0,n.t)(e=>e.admin);return(0,a.jsxs)("header",{className:"flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200",children:[(0,a.jsxs)("div",{className:"min-w-0",children:[a.jsx("h1",{className:"text-lg font-extrabold text-gray-900 truncate",children:e}),t&&a.jsx("p",{className:"text-sm text-gray-500 mt-0.5 truncate",children:t})]}),(0,a.jsxs)("div",{className:"flex items-center gap-3 shrink-0",children:[a.jsx(d.W,{}),(0,a.jsxs)("button",{className:"relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors",children:[a.jsx(r.Z,{className:"w-5 h-5 text-gray-600"}),a.jsx("span",{className:"absolute top-1.5 end-1.5 w-2 h-2 bg-hancr-violet rounded-full ring-2 ring-white"})]}),(0,a.jsxs)("div",{className:"flex items-center gap-2 ps-3 border-s border-gray-200",children:[a.jsx("div",{className:"flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet",children:a.jsx("span",{className:"text-xs font-extrabold text-white",children:i?(0,s.Qm)(i.email):"A"})}),(0,a.jsxs)("div",{className:"hidden sm:block",children:[a.jsx("p",{className:"text-sm font-bold text-gray-900 leading-tight max-w-[140px] truncate",children:i?.email??"Admin"}),a.jsx("p",{className:"text-xs text-gray-400 capitalize",children:i?.role??"admin"})]})]})]})]})}},79704:(e,t,i)=>{"use strict";i.d(t,{$c:()=>f,AO:()=>o,Ee:()=>I,FF:()=>j,HF:()=>r,K3:()=>l,MU:()=>$,QX:()=>y,TQ:()=>c,U9:()=>n,UU:()=>s,Uw:()=>u,Zc:()=>d,_G:()=>v,kC:()=>g,ku:()=>b,lG:()=>N,qi:()=>x,r1:()=>h,s:()=>m,x3:()=>p});var a=i(24293);let r=(0,a.Ps)`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      accessToken
      email
      role
    }
  }
`,n=(0,a.Ps)`
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
`,s=(0,a.Ps)`
  query RevenueStats($days: Int!) {
    revenueStats(days: $days) {
      date
      orderCount
      revenue
      platformRevenue
    }
  }
`,d=(0,a.Ps)`
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
`,o=(0,a.Ps)`
  mutation BanRider($id: Int!, $reason: String!) {
    banRider(id: $id, reason: $reason) {
      id
      banned
    }
  }
`,l=(0,a.Ps)`
  mutation UnbanRider($id: Int!) {
    unbanRider(id: $id) {
      id
      banned
    }
  }
`,c=(0,a.Ps)`
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
`,m=(0,a.Ps)`
  mutation ApproveDriver($id: Int!) {
    approveDriver(id: $id) {
      id
      active
    }
  }
`,u=(0,a.Ps)`
  mutation BanDriver($id: Int!) {
    banDriver(id: $id) {
      id
      banned
    }
  }
`,g=(0,a.Ps)`
  mutation UnbanDriver($id: Int!) {
    unbanDriver(id: $id) {
      id
      banned
    }
  }
`,p=(0,a.Ps)`
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
`,h=(0,a.Ps)`
  mutation ForceCancel($id: Int!) {
    forceCancel(id: $id) {
      id
      status
    }
  }
`,x=(0,a.Ps)`
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
`,f=(0,a.Ps)`
  mutation ToggleRegionEnabled($id: Int!) {
    toggleRegionEnabled(id: $id) {
      id
      enabled
    }
  }
`,b=(0,a.Ps)`
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
`,v=(0,a.Ps)`
  mutation ToggleServiceEnabled($id: Int!) {
    toggleServiceEnabled(id: $id) {
      id
      enabled
    }
  }
`,y=(0,a.Ps)`
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
`;(0,a.Ps)`
  query AppConfigs {
    appConfigs {
      id
      configKey
      version
      updatedAt
    }
  }
`;let $=(0,a.Ps)`
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
`,N=(0,a.Ps)`
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
`,j=(0,a.Ps)`
  mutation ResolveSos($input: ResolveSosInput!) {
    resolveSosIncident(input: $input) {
      id
      status
      adminNote
      resolvedAt
    }
  }
`,I=(0,a.Ps)`
  mutation EscalateSos($incidentId: Int!, $adminNote: String!) {
    escalateSosIncident(incidentId: $incidentId, adminNote: $adminNote) {
      id
      status
      adminNote
      policeNotified
    }
  }
`},51223:(e,t,i)=>{"use strict";i.d(t,{Qm:()=>l,cn:()=>n,p6:()=>o,uf:()=>s,xG:()=>d});var a=i(41135),r=i(31009);function n(...e){return(0,r.m6)((0,a.W)(e))}function s(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toString()}function d(e,t="SAR"){return new Intl.NumberFormat("ar-SA",{style:"currency",currency:t,minimumFractionDigits:2}).format(e)}function o(e){return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(e))}function l(e){return e.split(" ").slice(0,2).map(e=>e[0]?.toUpperCase()??"").join("")}},89948:(e,t,i)=>{"use strict";i.d(t,{Y:()=>a});let a=(0,i(68570).createProxy)(String.raw`E:\HANCR\apps\admin-panel\src\components\layout\Sidebar.tsx#Sidebar`)}};