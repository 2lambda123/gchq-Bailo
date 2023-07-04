import React from 'react'

const dashboardGeneralSteps = [
  {
    title: 'Welcome to the BAILO Dashboard Tour',
    target: 'body',
    key: 'welcome',
    placement: 'center',
    content: (
      <>
        <p>To get you started we will walk you through some of the features of BAILO.</p>
        <p>We will show you tours relevant to the page you are on, rather than showing you everything at once.</p>
        <p>
          To progress through the tour just click the Next button or press the Enter key. Some of the longer tours are
          broken down into sections. When available, the sections will be shown at the top and you can jump to a
          different section by clicking on it.
        </p>
      </>
    ),
  },
  {
    title: 'Marketplace Page Link',
    target: '#app-nav-bar button[aria-label="close drawer"]',
    // key: 'nav-menu-Marketplace',
    offset: -5,
    content: (
      <>
        <p>
          The Marketplace is the default landing page when you access Bailo. You can return to it from any other
          location in Bailo by clicking the Marketplace icon. Bailo shows a collection of models in a marketplace.
          Models in Bailo are viewable in the Marketplace, with a search bar in the top-right to filter the list.
        </p>
      </>
    ),
  },
]

export default dashboardGeneralSteps
