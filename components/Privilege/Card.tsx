import React from 'react'
import { IPrivilege } from '../../interfaces/Privilege/privilege'
import Link from 'next/link';

interface PrivilegeCardProps {
  data: IPrivilege,
}

const PrivilegeCard = ({data}: PrivilegeCardProps) => {
  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <img src={data.image} alt='image' />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-primary">{data.name}</h2>
        <p>{data.description}</p>
        <Link className="flex justify-end" href={`/cert/profile/privilege/${data._id}`}>
        <div className="divider"></div>
            <button className="btn btn-primary">Redeem</button>
        </Link>
      </div>
    </div>
  )
}

export default PrivilegeCard
