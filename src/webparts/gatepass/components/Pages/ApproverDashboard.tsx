import * as React from "react";
import type { IGatepassProps } from "../IGatepassProps";
import GatePass from "../../service/BAL/GatePass";
import "../Pages/Css/Sidebars.scss";
import { useHistory } from "react-router-dom";
import { GrView, GrEdit } from "react-icons/gr";
const ApproverDashboard: React.FC<IGatepassProps> = (props) => {
  const [searchText, setSearchText] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const [requests, setRequests] = React.useState<any[]>([]);
  const currentUserId = props.currentSPContext.pageContext.legacyPageContext.userId;
  const history = useHistory();

  const loadRequests = async () => {
    try {
      const service = GatePass();
      const data = await service.getRequests(props);
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };
  const pendingRequests = React.useMemo(() => {
    return requests
      .filter(
        (item) =>
          item.CurrentApprover?.Id === currentUserId
      )
      .sort((a, b) => b.Id - a.Id);
  }, [requests, currentUserId]);
  const filteredRequests = React.useMemo(() => {
    if (!searchText) return pendingRequests;

    const search = searchText.toLowerCase();

    return pendingRequests.filter((item) => {
      return (
        item.Id?.toString().toLowerCase().includes(search) ||
        item.VendorName?.VendorName?.toLowerCase().includes(search) ||
        item.City?.City?.toLowerCase().includes(search) ||
        item.Status?.toLowerCase().includes(search)
      );
    });
  }, [pendingRequests, searchText]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedRequests = React.useMemo(() => {
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage]);
  // const pendingRequests = requests.filter(
  //   (item) =>
  //     item.Status === "Pending For Approver" &&
  //     item.CurrentApprover?.Id === currentUserId
  // );



  React.useEffect(() => {
    loadRequests();
    setCurrentPage(1);
  }, [searchText]);
  return (
    <div className="main">

      {/* Header */}
      <div className="header">
        <div className="left-banner">
          <div className="logo-text">
            <h2> Approver Dashboard</h2>
          </div>
        </div>
      </div>


      {/* Search Section */}
      <div className="mainsecond">

        <input
          placeholder="Search"
          className="form-control"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />


        <select className="formtext-control">

          <option>All</option>
          <option>Pending for Approval</option>
          <option>Approved</option>
          <option>Rejected</option>
          <option>Send Back</option>
          <option>Draft</option>
          {/* <option>Paid</option>
          <option>Pending for UTR Update</option> */}

        </select>

      </div>



      {/* Table */}
      <main className="Main-Dash">

        <div className="table-vert-scroll">

          <table className="custom-table">

            <thead>

              <tr>
                <th>REQUEST ID</th>
                <th>VENDOR NAME</th>
                <th>LOCATION</th>
                <th>NO OF ITEMS</th>
                <th>GST INDICATOR</th>
                <th>STATUS</th>
                <th>APPROVE</th>
                <th>View</th>
              </tr>

            </thead>


            <tbody>
              {paginatedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7}>No Data</td>
                </tr>
              ) : (
                paginatedRequests.map((item) => (
                  <tr key={item.Id}>
                    <td>{item.Id}</td>
                    <td>{item.VendorName?.VendorName}</td>
                    <td>{item.City?.City}</td>
                    <td>{item.NoItems}</td>
                    <td>{item.GatePassReturnable}</td>
                    <td>{item.Status}</td>
                    <td>

                      <button
                        className="newBtn"
                        onClick={() => history.push(`/ApproverForm/${item.Id}`)}
                      >
                        <GrEdit />
                      </button>
                    </td>
                    <td>
                      <button
                        className="newBtn"
                        onClick={() => history.push(`/ViewForm/${item.Id}`)}
                      >
                        <GrView />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>



          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {totalPages || 1}
            </span>

            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>


        </div>

      </main>


    </div>
  );
};


export default ApproverDashboard;