import * as React from "react";
import { useParams, useHistory } from "react-router-dom";
import GatePass from "../../service/BAL/GatePass";
import AuthorisedSignatories from "../../service/BAL/AuthorisedSignatories";
import type { IGatepassProps } from "../IGatepassProps";
import "../Pages/Css/NewRequest.scss";
import SPCRUDOPS from "../../service/DAL/spcrudops";

interface IApproverDetails {
  Id: number;
  Name: string;
  Role: string;
  Level: number;
  status: string;
}

const ViewForm: React.FC<IGatepassProps> = (props) => {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = React.useState<any[]>([]);

  const history = useHistory();

  const [request, setRequest] = React.useState<any>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = React.useState<any[]>([]);
  
  const [approverDetails, setApproverDetails] = React.useState<IApproverDetails[]>([]);

  const loadData = async () => {
    try {
      const gateService = GatePass();
      const authService = AuthorisedSignatories();

      const res = await gateService.getRequestById(Number(id), props);
      const record = res?.[0];

      setRequest(record);

      const authItems = await authService.getAuthorisedByGatePassId(Number(id), props);
      setItems(authItems);

      if (record?.ApproverMatrics) {
        try {
          const parseddata = JSON.parse(record?.ApproverMatrics);
          setApproverDetails(Array.isArray(parseddata) ? parseddata : [parseddata])
        } catch (e) {
          console.error("ApproverMatrix parse error:", e);
          setApproverDetails([]);
        }
      }
      if (record?.WFH) {
        try {
          const parsed = JSON.parse(record.WFH);
          setWorkflow(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (e) {
          console.error("WFH parse error:", e);
          setWorkflow([]);
        }
      } else {
        setWorkflow([]);
      }

            const sp = await SPCRUDOPS();
      
            const docs = await sp.getData(
              "SupportingDocs",
              "Id,FileLeafRef,FileRef,GatePassID",
              "",
              `GatePassID eq '${id}'`,
              { column: "Id", isAscending: false },
              props,
            );
      
            console.log("Supporting Docs:", docs);
      
            setUploadedFiles(Array.isArray(docs) ? docs : []);

    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (id) loadData();
  }, [id]);

  return (
    <>
      <h3 className="section-title">View Form</h3>

      <div className="approval-ribbon">
        <div className="ribbon-step approved">{"Initiator"}</div>

        {approverDetails.map((approver, index) => (
          <div key={index} className="ribbon-step approver">
            {approver.Name}
          </div>
        ))}
      </div>
      <div className="new-request">

        <h3 className="page-title">Request Details</h3>

        <div className="section-title">Request Information</div>

        <div className="form-grid">
          <div>
            <label>Request By</label>
            <input value={request?.EmployeeName || ""} readOnly />
          </div>

          <div>
            <label>Department</label>
            <input value={request?.Department || ""} readOnly />
          </div>

          <div>
            <label>Reporting Manager</label>
            {/* <input value={request?.ReportingManagerId || ""} readOnly /> */}
            <input value={request?.ReportingManager?.Title || ""} readOnly />

          </div>

          <div>
            <label>Name of Vendor *</label>
            <input value={request?.VendorName?.VendorName || ""} readOnly />
          </div>

          <div>
            <label>Address of Vendor *</label>
            <textarea value={request?.Address || ""} readOnly />
          </div>

          <div>
            <label>Location *</label>
            <input value={request?.City?.City || ""} readOnly />
          </div>

          <div>
            <label>No of Items *</label>
            <input value={request?.NoItems || ""} readOnly />
          </div>

          <div>
            <label>UOM</label>
            <input value={request?.UOM || ""} readOnly />
          </div>

          <div>
            <label>No of Items in box *</label>
            <input value={request?.NoBox || ""} readOnly />
          </div>

          <div>
            <label>Gatepass is returnable or not ?</label>

            <input value={request?.GatePassReturnable || ""} readOnly />
          </div>
        </div>

        <div className="authorized">
          <label>Authorised Signatory *</label>

          <a>Click here to view Authorised Signatories</a>
        </div>

        <table className="item-table">
          <thead>
            <tr>
              <th>Sr.No</th>
              <th>Description of Material</th>
              <th>Quantity</th>
              <th>Approx Value</th>
              <th>Probable Date</th>
              <th>Purpose for Movement</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>No Items</td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.Id}>
                  <td>{index + 1}</td>
                  <td>
                    <input value={item.DescriptionMaterial || ""} readOnly />
                  </td>
                  <td>
                    <input value={item.Quantity || ""} readOnly />
                  </td>
                  <td>
                    <input value={item.ApproximateValue || ""} readOnly />
                  </td>
                  {/* <td><input value={item.ProbableDate || ""} readOnly /></td> */}
                  <td>
                    <input
                      value={item.ProbableDate
                        ? new Date(item.ProbableDate).toLocaleDateString()
                        : ""}
                      readOnly
                    />

                  </td>
                  <td>
                    <input value={item.PurposeMovement || ""} readOnly />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="authorized">
          Attach Supporting Documents
          {uploadedFiles.length === 0 ? (
            <span>No attachments</span>
          ) : (
            uploadedFiles.map((file) => (
              <div key={file.Id}>
                <a
                  href={`${file.FileRef}?web=1`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {file.FileLeafRef}
                </a>
              </div>
            ))
          )}
        </div>
        <br></br>

        <div className="section-title" style={{ width: "30%" }} >Workflow and Comment History</div>
        <br></br>
        <table className="item-table mt-4" >
          <thead>
            <tr>
              <th>Action By</th>
              <th>Action Taken</th>
              <th>Date</th>
              <th>Remark</th>
            </tr>
          </thead>

          <tbody>
            {workflow.length === 0 ? (
              <tr>
                <td colSpan={4}>No Workflow History</td>
              </tr>
            ) : (
              workflow.map((w: any, index: number) => (
                <tr key={index}>
                  <td>{w.CurrentApprover}</td>
                  <td>{w.ActionTaken}</td>
                  {/* <td>{new Date(w.Date).toLocaleString()}</td> */}
                  <td>{new Date(w.Date).toLocaleDateString()}</td>
                  <td>{w.Comment || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="bottom-area">
          <div>
            <label>Remarks</label>

            <textarea value={request?.Remarks || ""} readOnly />
          </div>
        </div>

        <div className="buttons">


          <button
            className="exit"
            onClick={() => history.push("/RequesterDashboard")}
          >
            Exit
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewForm;
