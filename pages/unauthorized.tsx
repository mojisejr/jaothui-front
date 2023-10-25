import React from 'react'
import Layout from '../components/Layouts'
import BitkubNextConnectButton from '../components/Shared/BitkubNext'


const UnauthorizePage = () => {
  return (
    <Layout>
    <div className="h-screen flex justify-center items-center">
      <BitkubNextConnectButton />
    </div>
    </Layout>
  )
}

export default UnauthorizePage
