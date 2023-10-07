import { HiMenuAlt2 } from "react-icons/hi";
import { BiSearchAlt2 } from "react-icons/bi";
const TopNav = () => {
  return (
    <>
      <div className="navbar bg-base-200 bg-opacity-20 px-[22px] sticky top-0 left-0">
        <div className="navbar-start">
          {/* <button className="btn btn-primary btn-circle"> */}
          <label htmlFor="my-drawer" className="btn btn-primary drawer-button">
            <HiMenuAlt2 size={24} />
          </label>

          {/* </button> */}
        </div>
        <div className="navbar-center">
          <div className="tabs tabs-boxed">
            <a className="tab tab-active font-bold">PED</a>
            <a className="tab font-bold">ART</a>
          </div>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-primary btn-circle">
              <BiSearchAlt2 size={24} />
            </label>
            <div
              tabIndex={0}
              className="dropdown-content z-[1] menu p-2 shadow bg-base-200 w-52"
            >
              <div className="join">
                <input className="input join-item w-3/4" placeholder="search" />
                <button className="btn btn-primary join-item w-1/4">Go!</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TopNav;
