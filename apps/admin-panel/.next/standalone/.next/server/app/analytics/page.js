(()=>{var e={};e.id=109,e.ids=[109],e.modules={72934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},27148:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>m,pages:()=>c,routeModule:()=>u,tree:()=>o}),a(2388),a(65976),a(53019),a(35866);var s=a(23191),r=a(88716),i=a(37922),n=a.n(i),l=a(95231),d={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>l[e]);a.d(t,d);let o=["",{children:["analytics",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,2388)),"E:\\HANCR\\apps\\admin-panel\\src\\app\\analytics\\page.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,65976)),"E:\\HANCR\\apps\\admin-panel\\src\\app\\analytics\\layout.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,53019)),"E:\\HANCR\\apps\\admin-panel\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,35866,23)),"next/dist/client/components/not-found-error"]}],c=["E:\\HANCR\\apps\\admin-panel\\src\\app\\analytics\\page.tsx"],m="/analytics/page",x={require:a,loadChunk:()=>Promise.resolve()},u=new s.AppPageRouteModule({definition:{kind:r.x.APP_PAGE,page:"/analytics/page",pathname:"/analytics",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:o}})},95228:(e,t,a)=>{Promise.resolve().then(a.bind(a,56575))},48941:(e,t,a)=>{Promise.resolve().then(a.bind(a,17676))},17069:(e,t,a)=>{"use strict";a.d(t,{Z:()=>s});let s=(0,a(62881).Z)("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]])},56575:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>f});var s=a(10326),r=a(39167),i=a(17577),n=a(62881);let l=(0,n.Z)("Calendar",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]),d=(0,n.Z)("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);var o=a(34565),c=a(17069);let m=(0,n.Z)("ChartColumn",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);var x=a(79704),u=a(64754),p=a(63944),h=a(51223),g=a(70773);function f(){let e=(0,g.NT)(),[t,a]=(0,i.useState)(30),{data:n}=(0,r.aM)(x.U9),{data:f,loading:y}=(0,r.aM)(x.UU,{variables:{days:t}}),b=n?.dashboardStats,j=f?.revenueStats??[],N=j.reduce((e,t)=>e+t.revenue,0),w=j.reduce((e,t)=>e+t.platformRevenue,0),$=j.reduce((e,t)=>e+t.orderCount,0);return(0,s.jsxs)("div",{children:[s.jsx(p.Z,{title:e("analytics.title"),subtitle:e("analytics.subtitle")}),(0,s.jsxs)("div",{className:"p-6 space-y-6",children:[(0,s.jsxs)("div",{className:"flex items-center gap-2 flex-wrap",children:[s.jsx("span",{className:"text-sm font-bold text-gray-700",children:e("analytics.period")}),[7,14,30,90].map(r=>(0,s.jsxs)("button",{onClick:()=>a(r),className:`btn-sm ${t===r?"btn-primary":"btn-outline"}`,children:[s.jsx(l,{className:"w-3.5 h-3.5"}),e("analytics.daysLabel",{days:r})]},r))]}),(0,s.jsxs)("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:[s.jsx(v,{label:e("analytics.summary.revenue",{days:t}),value:(0,h.xG)(N),icon:d,iconBg:"#F3E8FF",iconColor:"#8B2EE6"}),s.jsx(v,{label:e("analytics.summary.orders",{days:t}),value:(0,h.uf)($),icon:o.Z,iconBg:"#DBEAFE",iconColor:"#2563EB"}),s.jsx(v,{label:e("analytics.summary.avgPerOrder"),value:(0,h.xG)($?N/$:0),icon:c.Z,iconBg:"#D1FAE5",iconColor:"#059669"}),s.jsx(v,{label:e("analytics.summary.platformCommission"),value:(0,h.xG)(w),icon:m,iconBg:"#FEF3C7",iconColor:"#D97706"})]}),(0,s.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-3 gap-4",children:[(0,s.jsxs)("div",{className:"card p-6 bg-gradient-to-br from-hancr-navy to-hancr-purple text-white relative overflow-hidden",children:[s.jsx("div",{className:"absolute -top-12 -right-12 w-48 h-48 rounded-full bg-hancr-violet/20 blur-3xl"}),(0,s.jsxs)("div",{className:"relative z-10",children:[s.jsx("p",{className:"text-xs font-bold uppercase tracking-wider text-white/70",children:e("analytics.overview.totalRevenue")}),s.jsx("p",{className:"text-4xl font-extrabold mt-2",children:(0,h.xG)(b?.totalRevenue??0)}),s.jsx("p",{className:"text-xs text-white/60 mt-2",children:e("analytics.overview.sinceStart")})]})]}),(0,s.jsxs)("div",{className:"card p-6",children:[s.jsx("p",{className:"stat-tile-label",children:e("analytics.overview.totalOrders")}),s.jsx("p",{className:"stat-tile-value",children:(0,h.uf)(b?.totalOrders??0)}),(0,s.jsxs)("div",{className:"mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs",children:[s.jsx("span",{className:"text-emerald-600 font-bold",children:e("analytics.overview.completedShort",{count:b?.completedOrders??0})}),s.jsx("span",{className:"text-rose-500 font-bold",children:e("analytics.overview.canceledShort",{count:b?.canceledOrders??0})})]})]}),(0,s.jsxs)("div",{className:"card p-6",children:[s.jsx("p",{className:"stat-tile-label",children:e("analytics.overview.platformUsers")}),s.jsx("p",{className:"stat-tile-value",children:(0,h.uf)((b?.totalRiders??0)+(b?.totalDrivers??0))}),(0,s.jsxs)("div",{className:"mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs",children:[s.jsx("span",{className:"text-blue-600 font-bold",children:e("analytics.overview.ridersShort",{count:b?.totalRiders??0})}),s.jsx("span",{className:"text-hancr-violet font-bold",children:e("analytics.overview.driversShort",{count:b?.totalDrivers??0})})]})]})]}),(0,s.jsxs)("div",{className:"card p-6",children:[(0,s.jsxs)("div",{className:"flex items-center justify-between mb-5 flex-wrap gap-3",children:[(0,s.jsxs)("div",{children:[s.jsx("h2",{className:"font-extrabold text-gray-900 text-lg",children:e("analytics.chart.title")}),s.jsx("p",{className:"text-sm text-gray-500 mt-0.5",children:e("analytics.chart.lastDays",{days:t})})]}),(0,s.jsxs)("div",{className:"flex items-center gap-4 text-xs",children:[(0,s.jsxs)("span",{className:"inline-flex items-center gap-1.5 text-gray-600 font-medium",children:[s.jsx("span",{className:"w-3 h-0.5 bg-hancr-violet inline-block rounded"}),e("dashboard.chart.revenue")]}),(0,s.jsxs)("span",{className:"inline-flex items-center gap-1.5 text-gray-600 font-medium",children:[s.jsx("span",{className:"w-3 h-0.5 bg-hancr-navy inline-block rounded"}),e("dashboard.chart.orders")]})]})]}),y?s.jsx("div",{className:"h-64 flex items-center justify-center text-gray-400",children:(0,s.jsxs)("div",{className:"inline-flex items-center gap-2",children:[s.jsx("div",{className:"w-4 h-4 border-2 border-hancr-violet border-t-transparent rounded-full animate-spin"}),e("common.loading")]})}):0===j.length?(0,s.jsxs)("div",{className:"h-64 flex flex-col items-center justify-center gap-3 text-gray-400",children:[s.jsx(m,{className:"w-12 h-12 text-gray-300"}),s.jsx("p",{className:"text-sm font-medium",children:e("analytics.chart.empty")})]}):s.jsx(u.y,{data:j})]}),j.length>0&&(0,s.jsxs)("div",{className:"card p-6",children:[s.jsx("h2",{className:"font-extrabold text-gray-900 text-lg mb-4",children:e("analytics.table.title")}),s.jsx("div",{className:"table-container",children:(0,s.jsxs)("table",{className:"table",children:[s.jsx("thead",{children:(0,s.jsxs)("tr",{children:[s.jsx("th",{children:e("analytics.table.date")}),s.jsx("th",{children:e("analytics.table.revenue")}),s.jsx("th",{children:e("analytics.table.orders")}),s.jsx("th",{children:e("analytics.table.avgPerOrder")}),s.jsx("th",{children:e("analytics.table.platformCommission")})]})}),s.jsx("tbody",{children:[...j].reverse().map(e=>(0,s.jsxs)("tr",{children:[s.jsx("td",{className:"font-mono text-sm ltr",children:e.date}),s.jsx("td",{className:"font-bold text-gray-900",children:(0,h.xG)(e.revenue)}),s.jsx("td",{className:"font-bold text-gray-700",children:e.orderCount}),s.jsx("td",{className:"text-gray-500",children:e.orderCount?(0,h.xG)(e.revenue/e.orderCount):"—"}),s.jsx("td",{className:"text-hancr-violet font-bold",children:(0,h.xG)(e.platformRevenue)})]},e.date))})]})})]})]})]})}function v({label:e,value:t,icon:a,iconBg:r,iconColor:i}){return s.jsx("div",{className:"stat-tile",children:(0,s.jsxs)("div",{className:"flex items-start justify-between",children:[(0,s.jsxs)("div",{className:"min-w-0",children:[s.jsx("p",{className:"stat-tile-label",children:e}),s.jsx("p",{className:"stat-tile-value truncate",children:t})]}),s.jsx("div",{className:"flex items-center justify-center w-11 h-11 rounded-xl shrink-0",style:{backgroundColor:r},children:s.jsx(a,{className:"w-5 h-5",style:{color:i}})})]})})}},64754:(e,t,a)=>{"use strict";a.d(t,{y:()=>x});var s=a(10326),r=a(30660),i=a(66677),n=a(18423),l=a(62637),d=a(9997),o=a(44675),c=a(47445),m=a(51223);function x({data:e}){return s.jsx(r.h,{width:"100%",height:260,children:(0,s.jsxs)(i.T,{data:e,margin:{top:4,right:4,left:0,bottom:0},children:[(0,s.jsxs)("defs",{children:[(0,s.jsxs)("linearGradient",{id:"colorRevenue",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#B048FF",stopOpacity:.15}),s.jsx("stop",{offset:"95%",stopColor:"#B048FF",stopOpacity:0})]}),(0,s.jsxs)("linearGradient",{id:"colorOrders",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#22223B",stopOpacity:.12}),s.jsx("stop",{offset:"95%",stopColor:"#22223B",stopOpacity:0})]})]}),s.jsx(n.q,{strokeDasharray:"3 3",stroke:"#f0f0f0",vertical:!1}),s.jsx(l.K,{dataKey:"date",tickLine:!1,axisLine:!1,tick:{fontSize:11,fill:"#9ca3af"},tickFormatter:e=>e.slice(5)}),s.jsx(d.B,{tickLine:!1,axisLine:!1,tick:{fontSize:11,fill:"#9ca3af"},tickFormatter:e=>e>=1e3?`${(e/1e3).toFixed(0)}k`:e,width:40}),s.jsx(o.u,{contentStyle:{background:"#22223B",border:"none",borderRadius:8,color:"#F2E9E4",fontSize:12},formatter:(e,t)=>"revenue"===t?[(0,m.xG)(e),"الإيرادات"]:[e,"الطلبات"]}),s.jsx(c.u,{type:"monotone",dataKey:"revenue",stroke:"#B048FF",strokeWidth:2,fill:"url(#colorRevenue)",dot:!1,activeDot:{r:4,fill:"#B048FF"}}),s.jsx(c.u,{type:"monotone",dataKey:"orderCount",stroke:"#22223B",strokeWidth:2,fill:"url(#colorOrders)",dot:!1,activeDot:{r:4,fill:"#22223B"}})]})})}},44642:(e,t,a)=>{"use strict";a.d(t,{W:()=>o});var s=a(10326),r=a(17577),i=a(98485),n=a(32933),l=a(70773),d=a(16358);function o(){let{locale:e,setLocale:t}=(0,l.bU)(),[a,o]=(0,r.useState)(!1),c=(0,r.useRef)(null),m=d.RF.find(t=>t.code===e),x=e=>{t(e),o(!1)};return(0,s.jsxs)("div",{className:"relative",ref:c,children:[(0,s.jsxs)("button",{onClick:()=>o(!a),className:"inline-flex items-center justify-center gap-2 h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors","aria-label":"Change language",children:[s.jsx(i.Z,{className:"w-4 h-4"}),s.jsx("span",{className:"text-sm font-bold",children:m.flag}),s.jsx("span",{className:"text-xs font-bold uppercase",children:m.code})]}),a&&s.jsx("div",{className:"absolute end-0 mt-2 w-48 card p-1.5 animate-fade-in z-50",style:{minWidth:"12rem"},children:d.RF.map(t=>{let a=t.code===e;return(0,s.jsxs)("button",{onClick:()=>x(t.code),className:`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                  transition-colors ${a?"bg-hancr-violet-light text-hancr-violet-deep font-bold":"text-gray-700 hover:bg-gray-50"}`,children:[s.jsx("span",{className:"text-lg",children:t.flag}),s.jsx("span",{className:"flex-1 text-start",children:t.label}),a&&s.jsx(n.Z,{className:"w-4 h-4"})]},t.code)})})]})}},17676:(e,t,a)=>{"use strict";a.d(t,{Sidebar:()=>N});var s=a(10326),r=a(90434),i=a(35047),n=a(24319),l=a(81536),d=a(24061),o=a(34565),c=a(15601),m=a(88378),x=a(77636),u=a(3634),p=a(66184),h=a(6507),g=a(39183),f=a(71810),v=a(51223),y=a(66591),b=a(70773),j=a(40381);function N(){let e=(0,b.NT)(),t=(0,i.usePathname)(),a=(0,i.useRouter)(),N=(0,y.t)(e=>e.logout),w=[{key:"nav.dashboard",icon:n.Z,href:"/dashboard"},{key:"nav.drivers",icon:l.Z,href:"/users/drivers"},{key:"nav.riders",icon:d.Z,href:"/users/riders"},{key:"nav.orders",icon:o.Z,href:"/orders"},{key:"nav.sos",icon:c.Z,href:"/sos"},{key:"nav.services",icon:m.Z,href:"/services"},{key:"nav.regions",icon:x.Z,href:"/regions"},{key:"nav.features",icon:u.Z,href:"/features"},{key:"nav.analytics",icon:p.Z,href:"/analytics"},{key:"nav.notifications",icon:h.Z,href:"/settings"}];return(0,s.jsxs)("aside",{className:"flex flex-col w-60 h-screen bg-hancr-navy border-e border-sidebar-border shrink-0",children:[(0,s.jsxs)("div",{className:"flex items-center gap-3 px-5 py-5 border-b border-sidebar-border",children:[s.jsx("div",{className:"flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet",children:s.jsx("span",{className:"text-lg font-extrabold text-white",children:"H"})}),(0,s.jsxs)("div",{children:[s.jsx("p",{className:"text-white font-extrabold text-sm leading-tight",children:e("brand.name")}),s.jsx("p",{className:"text-sidebar-muted text-xs",children:e("brand.tagline")})]})]}),s.jsx("nav",{className:"flex-1 py-4 overflow-y-auto",children:s.jsx("div",{className:"px-3 space-y-0.5",children:w.map(a=>{let i=t===a.href||"/dashboard"!==a.href&&t.startsWith(a.href);return(0,s.jsxs)(r.default,{href:a.href,className:(0,v.cn)("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-150",i?"sidebar-item-active":"text-sidebar-muted hover:text-white hover:bg-white/5"),children:[s.jsx(a.icon,{className:"w-4.5 h-4.5 shrink-0",strokeWidth:i?2.5:2}),s.jsx("span",{className:"flex-1",children:e(a.key)}),i&&s.jsx(g.Z,{className:"w-3.5 h-3.5 text-hancr-violet opacity-80 rtl:rotate-180"})]},a.href)})})}),s.jsx("div",{className:"px-3 py-4 border-t border-sidebar-border",children:(0,s.jsxs)("button",{onClick:()=>{N(),j.ZP.success(e("auth.signedOut")),a.push("/login")},className:"flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-bold text-sidebar-muted hover:text-white hover:bg-red-500/10 transition-all",children:[s.jsx(f.Z,{className:"w-4.5 h-4.5 shrink-0"}),s.jsx("span",{children:e("auth.logout")})]})})]})}},63944:(e,t,a)=>{"use strict";a.d(t,{Z:()=>d});var s=a(10326),r=a(6507),i=a(66591),n=a(51223),l=a(44642);function d({title:e,subtitle:t}){let a=(0,i.t)(e=>e.admin);return(0,s.jsxs)("header",{className:"flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200",children:[(0,s.jsxs)("div",{className:"min-w-0",children:[s.jsx("h1",{className:"text-lg font-extrabold text-gray-900 truncate",children:e}),t&&s.jsx("p",{className:"text-sm text-gray-500 mt-0.5 truncate",children:t})]}),(0,s.jsxs)("div",{className:"flex items-center gap-3 shrink-0",children:[s.jsx(l.W,{}),(0,s.jsxs)("button",{className:"relative p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors",children:[s.jsx(r.Z,{className:"w-5 h-5 text-gray-600"}),s.jsx("span",{className:"absolute top-1.5 end-1.5 w-2 h-2 bg-hancr-violet rounded-full ring-2 ring-white"})]}),(0,s.jsxs)("div",{className:"flex items-center gap-2 ps-3 border-s border-gray-200",children:[s.jsx("div",{className:"flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-hancr-violet to-hancr-violet-deep shadow-violet",children:s.jsx("span",{className:"text-xs font-extrabold text-white",children:a?(0,n.Qm)(a.email):"A"})}),(0,s.jsxs)("div",{className:"hidden sm:block",children:[s.jsx("p",{className:"text-sm font-bold text-gray-900 leading-tight max-w-[140px] truncate",children:a?.email??"Admin"}),s.jsx("p",{className:"text-xs text-gray-400 capitalize",children:a?.role??"admin"})]})]})]})]})}},79704:(e,t,a)=>{"use strict";a.d(t,{$c:()=>f,AO:()=>d,Ee:()=>$,FF:()=>w,HF:()=>r,K3:()=>o,MU:()=>j,QX:()=>b,TQ:()=>c,U9:()=>i,UU:()=>n,Uw:()=>x,Zc:()=>l,_G:()=>y,kC:()=>u,ku:()=>v,lG:()=>N,qi:()=>g,r1:()=>h,s:()=>m,x3:()=>p});var s=a(24293);let r=(0,s.Ps)`
  mutation AdminLogin($email: String!, $password: String!) {
    adminLogin(email: $email, password: $password) {
      accessToken
      email
      role
    }
  }
`,i=(0,s.Ps)`
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
`,n=(0,s.Ps)`
  query RevenueStats($days: Int!) {
    revenueStats(days: $days) {
      date
      orderCount
      revenue
      platformRevenue
    }
  }
`,l=(0,s.Ps)`
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
`,d=(0,s.Ps)`
  mutation BanRider($id: Int!, $reason: String!) {
    banRider(id: $id, reason: $reason) {
      id
      banned
    }
  }
`,o=(0,s.Ps)`
  mutation UnbanRider($id: Int!) {
    unbanRider(id: $id) {
      id
      banned
    }
  }
`,c=(0,s.Ps)`
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
`,m=(0,s.Ps)`
  mutation ApproveDriver($id: Int!) {
    approveDriver(id: $id) {
      id
      active
    }
  }
`,x=(0,s.Ps)`
  mutation BanDriver($id: Int!) {
    banDriver(id: $id) {
      id
      banned
    }
  }
`,u=(0,s.Ps)`
  mutation UnbanDriver($id: Int!) {
    unbanDriver(id: $id) {
      id
      banned
    }
  }
`,p=(0,s.Ps)`
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
`,h=(0,s.Ps)`
  mutation ForceCancel($id: Int!) {
    forceCancel(id: $id) {
      id
      status
    }
  }
`,g=(0,s.Ps)`
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
`,f=(0,s.Ps)`
  mutation ToggleRegionEnabled($id: Int!) {
    toggleRegionEnabled(id: $id) {
      id
      enabled
    }
  }
`,v=(0,s.Ps)`
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
`,y=(0,s.Ps)`
  mutation ToggleServiceEnabled($id: Int!) {
    toggleServiceEnabled(id: $id) {
      id
      enabled
    }
  }
`,b=(0,s.Ps)`
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
`;(0,s.Ps)`
  query AppConfigs {
    appConfigs {
      id
      configKey
      version
      updatedAt
    }
  }
`;let j=(0,s.Ps)`
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
`,N=(0,s.Ps)`
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
`,w=(0,s.Ps)`
  mutation ResolveSos($input: ResolveSosInput!) {
    resolveSosIncident(input: $input) {
      id
      status
      adminNote
      resolvedAt
    }
  }
`,$=(0,s.Ps)`
  mutation EscalateSos($incidentId: Int!, $adminNote: String!) {
    escalateSosIncident(incidentId: $incidentId, adminNote: $adminNote) {
      id
      status
      adminNote
      policeNotified
    }
  }
`},51223:(e,t,a)=>{"use strict";a.d(t,{Qm:()=>o,cn:()=>i,p6:()=>d,uf:()=>n,xG:()=>l});var s=a(41135),r=a(31009);function i(...e){return(0,r.m6)((0,s.W)(e))}function n(e){return e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(1)+"K":e.toString()}function l(e,t="SAR"){return new Intl.NumberFormat("ar-SA",{style:"currency",currency:t,minimumFractionDigits:2}).format(e)}function d(e){return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(e))}function o(e){return e.split(" ").slice(0,2).map(e=>e[0]?.toUpperCase()??"").join("")}},65976:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>i});var s=a(19510),r=a(71395);function i({children:e}){return s.jsx(r.L,{children:e})}},2388:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>s});let s=(0,a(68570).createProxy)(String.raw`E:\HANCR\apps\admin-panel\src\app\analytics\page.tsx#default`)},71395:(e,t,a)=>{"use strict";a.d(t,{L:()=>i});var s=a(19510),r=a(89948);function i({children:e}){return(0,s.jsxs)("div",{className:"flex h-screen overflow-hidden",children:[s.jsx(r.Y,{}),s.jsx("main",{className:"flex-1 overflow-y-auto bg-gray-50",children:e})]})}},89948:(e,t,a)=>{"use strict";a.d(t,{Y:()=>s});let s=(0,a(68570).createProxy)(String.raw`E:\HANCR\apps\admin-panel\src\components\layout\Sidebar.tsx#Sidebar`)}};var t=require("../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[164,371,76,691,167,761,483],()=>a(27148));module.exports=s})();