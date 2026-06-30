import * as React from "react";
import { useParams, useHistory } from "react-router-dom";
import type { IGatepassProps } from "../IGatepassProps";
import "../Pages/Css/NewRequest.scss";
import GatePass from "../../service/BAL/GatePass";
import AuthorisedSignatories from "../../service/BAL/AuthorisedSignatories";
import SPCRUDOPS from "../../service/DAL/spcrudops";

interface IApproverDetails {
  Id: number;
  Name: string;
  Role: string;
  Level: number;
  Status: string;
}

const ApproverForm: React.FC<IGatepassProps> = (props) => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  //const { id } = useParams();
  const service = GatePass();
  const [request, setRequest] = React.useState<any>(null);
  const [items, setItems] = React.useState<any[]>([]);
  const [workflow, setWorkflow] = React.useState<any[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [remarks, setRemarks] = React.useState("");
  const [uploadedFiles, setUploadedFiles] = React.useState<any[]>([]);
  const [approverDetails, setApproverDetails] = React.useState<
    IApproverDetails[]
  >([]);

  // const loadRequestById = async (id: number) => {
  //   try {
  //     const service = GatePass();
  //     const data = await service.getRequests(props);

  //     const selected = data.find((x: any) => x.Id === Number(id));

  //     setRequest(selected);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const load = async () => {
  //   try {
  //     const gateService = GatePass();
  //     const authService = AuthorisedSignatories();

  //     const res = await gateService.getRequestById(Number(id), props);
  //     const record = res?.[0];

  //     setRequest(record);

  //     if (record?.WFH) {
  //       try {
  //         const parsed = JSON.parse(record.WFH);
  //         setWorkflow(Array.isArray(parsed) ? parsed : [parsed]);
  //       } catch (e) {
  //         console.error("WFH parse error:", e);
  //         setWorkflow([]);
  //       }
  //     }

  //     const authItems = await authService.getAuthorisedByGatePassId(
  //       Number(id),
  //       props
  //     );
  //     setItems(authItems);

  //   } catch (err) {
  //     console.error(err);
  //   }
  // };
  const load = async () => {
    try {
      const gateService = GatePass();
      const authService = AuthorisedSignatories();

      const res = await gateService.getRequestById(Number(id), props);
      const record = res?.[0];
      setRequest(record);

      const authItems = await authService.getAuthorisedByGatePassId(
        Number(id),
        props,
      );
      setItems(authItems);

      if (record?.ApproverMatrics) {
        try {
          const parseddata = JSON.parse(record?.ApproverMatrics);
          setApproverDetails(
            Array.isArray(parseddata) ? parseddata : [parseddata],
          );
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
  const handleApprove = async () => {
    if (isSaving) return;

    try {
      setIsSaving(true);

      const gateService = GatePass();

      // let newStatus = "";
      // let nextApproverId = 0;

      // if (request.Status === "Pending For Approval") {
      //   newStatus = "Pending For FS Approval";
      //   nextApproverId = request.FSApproverId;
      // }
      // else if (request.Status === "Pending For FS Approval") {
      //   newStatus = "Pending For Security Admin Approval";
      //   nextApproverId = request.SecurityAdminId;
      // }
      // else if (request.Status === "Pending For Security Admin Approval") {
      //   newStatus = "Approved";
      // }
      const currentUserId =
        props.currentSPContext.pageContext.legacyPageContext.userId;

      // Existing matrix from request
      let matrix = [...approverDetails];

      // Current pending approver before approval
      const oldPending = matrix.find((x) => x.Status === "Pending");

      // Mark current approver as Approved
      const currentIndex = matrix.findIndex(
        (x) => Number(x.Id) === Number(currentUserId) && x.Status === "Pending",
      );

      if (currentIndex !== -1) {
        matrix[currentIndex].Status = "Approved";
      }

      // -------------------------
      // GET LATEST APPROVAL MATRIX
      // -------------------------

      const spCrudOps = await SPCRUDOPS();

      const latestApprovalMatrix = await spCrudOps.getData(
        "ApproveMatrics",
        "Id,CurrentApprover/Id,CurrentApprover/Title,Role,Status,Level",
        "CurrentApprover",
        "Status eq 'Active'",
        { column: "ID", isAscending: true },
        props,
      );

      // Convert SharePoint data to same format

      const latestMatrix = latestApprovalMatrix.map((x: any) => ({
        Id: x.CurrentApprover?.Id,
        Name: x.CurrentApprover?.Title,
        Role: x.Role,
        Level: x.Level,
        Status: "Waiting",
      }));

      // --------------------------------------------------
      // UPDATE EXISTING MATRIX
      // KEEP OLD ROLES IF REMOVED FROM MASTER
      // --------------------------------------------------

      matrix = matrix.map((oldItem) => {
        const latestItem = latestMatrix.find(
          (x) => String(x.Role) === String(oldItem.Role),
        );

        if (latestItem) {
          return {
            ...oldItem,
            Id: latestItem.Id,
            Name: latestItem.Name,
            Level: latestItem.Level,
          };
        }

        // Role removed from master matrix
        // Keep old record and status

        return oldItem;
      });

      // --------------------------------------------------
      // ADD NEW ROLES ADDED IN MASTER MATRIX
      // --------------------------------------------------

      latestMatrix.forEach((latestItem) => {
        const exists = matrix.some(
          (x) => String(x.Role) === String(latestItem.Role),
        );

        if (!exists) {
          matrix.push({
            ...latestItem,
            Status: "Waiting",
          });
        }
      });

      // --------------------------------------------------
      // IF CURRENT PENDING ROLE REMOVED
      // --------------------------------------------------

      if (oldPending) {
        const roleExists = matrix.some(
          (x) => String(x.Role) === String(oldPending.Role),
        );

        if (!roleExists) {
          const nextWaiting = matrix.find((x) => x.Status === "Waiting");

          if (nextWaiting) {
            nextWaiting.Status = "Pending";
          }
        }
      }

      // --------------------------------------------------
      // FIND NEXT APPROVER
      // --------------------------------------------------

      let nextApprover = matrix.find((x) => x.Status === "Pending");

      if (!nextApprover) {
        const nextWaiting = matrix.find((x) => x.Status === "Waiting");

        if (nextWaiting) {
          nextWaiting.Status = "Pending";
          nextApprover = nextWaiting;
        }
      }

      let newStatus = "Approved";
      let nextApproverId: number | null = null;

      if (nextApprover) {
        newStatus = `Pending For ${nextApprover.Role} Approval`;
        nextApproverId = nextApprover.Id;
      }

      console.log("Old Matrix", approverDetails);
      console.log("Latest Matrix", latestMatrix);
      console.log("Final Matrix", matrix);
      console.log("Next Approver", nextApprover);

      const updatedWorkflow = [
        ...(workflow || []),
        {
          CurrentApprover: props.currentSPContext.pageContext.user.displayName,
          ActionTaken: "Approved",
          Comment: remarks,
          Date: new Date().toISOString(),
          CurrentStatus: newStatus,
        },
      ];

      await gateService.updateRequest(
        request.Id,
        {
          Status: newStatus,
          CurrentApproverId: nextApproverId,
          WFH: JSON.stringify(updatedWorkflow),
          ApproverMatrics: JSON.stringify(matrix),
        },
        props,
      );

      alert("Request Approved successfully");
      history.push("/ApproverDashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  const handleSendBack = async () => {
    if (isSaving) return;
    if (!remarks || remarks.trim() === "") {
      alert("Remarks are mandatory for Send Back");
      return;
    }
    try {
      setIsSaving(true);

      const gateService = GatePass();

      const updatedWorkflow = [
        ...(workflow || []),
        {
          CurrentApprover: props.currentSPContext.pageContext.user.displayName,
          ActionTaken: "Sent Back",
          Comment: remarks,
          Date: new Date().toISOString(),
          CurrentStatus: "Sent Back",
        },
      ];

      await gateService.updateRequest(
        request.Id,
        {
          Status: "Sent Back",
          WFH: JSON.stringify(updatedWorkflow),
        },
        props,
      );

      alert("Sent back successfully");
      history.push("/ApproverDashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };
  const handleReject = async () => {
    const gateService = GatePass();

    const updatedWorkflow = [
      ...(workflow || []),
      {
        CurrentApprover: props.currentSPContext.pageContext.user.displayName,
        ActionTaken: "Rejected",
        Comment: remarks,
        Date: new Date().toISOString(),
        CurrentStatus: "Rejected",
      },
    ];

    await gateService.updateRequest(
      request.Id,
      {
        Status: "Rejected",
        WFH: JSON.stringify(updatedWorkflow),
      },
      props,
    );

    alert("Rejected");
    history.push("/ApproverDashboard");
  };
  React.useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  return (
    <>
      <h3 className="section-title">Approver Form</h3>
      <div className="approval-ribbon">
        <div className="ribbon-step approved">{"Initiator"}</div>
        {approverDetails.map((step, index) => {
          let className = "waiting";

          if (step.Status === "initiator") className = "initiator";
          if (step.Status === "Approved") className = "approved";
          if (step.Status === "current") className = "current";

          return (
            <div key={index} className={`ribbon-step ${className}`}>
              {step.Name}
            </div>
          );
        })}
        {/* {approverDetails.map((approver, index) => (
          <div key={index} className="ribbon-step approver">
            {approver.Name}
          </div>
        ))} */}
      </div>
      <div className="new-request">
        <h3 className="page-title">Request Details</h3>

        <div className="section-title">Request Information</div>

        <div className="form-grid">
          <div>
            <label>Request By</label>
            <input type="text" value={request?.EmployeeName || ""} readOnly />
          </div>

          <div>
            <label>Department</label>
            <input type="text" value={request?.Department || ""} readOnly />
          </div>

          <div>
            <label>Reporting Manager</label>
            {/* <input value={request?.ReportingManagerId || ""} readOnly /> */}
            <input value={request?.ReportingManager?.Title || ""} readOnly />
          </div>

          <div>
            <label>Name of Vendor *</label>
            <input
              type="text"
              value={request?.VendorName?.VendorName || ""}
              readOnly
            />
          </div>

          <div>
            <label>Address of Vendor *</label>
            <input type="text" value={request?.Address || ""} readOnly />
          </div>

          <div>
            <label>Location *</label>
            <input type="text" value={request?.City?.City || ""} readOnly />
          </div>

          <div>
            <label>No of Items *</label>
            <input type="text" value={request?.NoItems || ""} readOnly />
          </div>

          <div>
            <label>UOM</label>
            <input type="text" value={request?.UOM || ""} readOnly />
          </div>

          <div>
            <label>No of Items in box *</label>
            <input type="text" value={request?.NoBox || ""} readOnly />
          </div>

          <div>
            <label>Gatepass is returnable or not ?</label>

            <input
              type="text"
              value={request?.GatePassReturnable || ""}
              readOnly
            />
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
                      value={
                        item.ProbableDate
                          ? new Date(item.ProbableDate).toLocaleDateString(
                              "en-IN",
                            )
                          : ""
                      }
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

        <div className="section-title" style={{ width: "30%" }}>
          Workflow and Comment History
        </div>
        <br></br>
        <table className="item-table mt-4">
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
                  <td>{new Date(w.Date).toLocaleDateString("en-IN")}</td>
                  <td>{w.Comment || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="bottom-area">
          <div>
            <label>Approver Remarks</label>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        <div className="buttons">
          <button
            className="submit"
            onClick={handleApprove}
            disabled={isSaving}
          >
            Approve
          </button>

          <button
            className="draft"
            onClick={handleSendBack}
            disabled={isSaving}
          >
            Send Back
          </button>
          <button className="reject" onClick={handleReject} disabled={isSaving}>
            Reject
          </button>

          <button
            className="exit"
            onClick={() => history.push("/ApproverDashboard")}
          >
            Exit
          </button>
        </div>
      </div>
    </>
  );
};

export default ApproverForm;
