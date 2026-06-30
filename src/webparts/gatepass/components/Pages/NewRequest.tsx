import * as React from "react";
import { useEffect, useState } from "react";

import type { IGatepassProps } from "../IGatepassProps";
import { useHistory } from "react-router-dom";
import "../Pages/Css/NewRequest.scss";
import Request from "../../service/BAL/Request";
import Vendor from "../../service/BAL/Vendor";
import Location from "../../service/BAL/LocationMaster";
import SPCRUDOPS from "../../service/DAL/spcrudops";
import GatePass from "../../service/BAL/GatePass";
import type { IGatePass } from "../../service/INTERFACE/GatePass";
import AuthorisedSignatories from "../../service/BAL/AuthorisedSignatories";
import ApproverMatrics from "../../service/BAL/ApprovrMatrics";
interface IApproverDetails {
  Id: number;
  Name: string;
  Role: string;
  Level: number;
  status: string;
}
const NewRequest: React.FC<IGatepassProps> = (props) => {
  const [approverMatrix, setApproverMatrix] = useState<any[]>([]);
  const [supportingFiles, setSupportingFiles] = useState<File[]>([]);
  // const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
const [isDraftLoading, setIsDraftLoading] = useState(false);

  const [header, setHeader] = useState({
    EmployeeName: "",
    department: "",
    reportingManagerId: 0,
    reportingManager: "",
  });

  const buildWorkflowHistory = (status: string, comment: string = "") => {
    const actionTaken =
      status === "Pending For Approver" ? "Submitted" : status;

    return {
      CurrentApprover: props.currentSPContext.pageContext.user.displayName,
      ActionTaken: actionTaken,
      Comment: comment,
      Date: new Date().toISOString(),
      CurrentStatus: status,
    };
  };
  const [approverDetails, setApproverDetails] = useState<IApproverDetails[]>(
    [],
  );

  const buildApproverMatrix = () => {
    const user = props.currentSPContext.pageContext.user;

    return [
      {
        Level: 1,
        Role: "RM",
        UserName: header.reportingManager,
        UserId: header.reportingManagerId,
        Status: "Pending",
      },
      {
        Level: 2,
        Role: "FS",
        UserName: user.displayName,
        UserId: user.id,
        Status: "Waiting",
      },
      {
        Level: 3,
        Role: "SecurityAdmin",
        UserName: "",
        UserId: 0,
        Status: "Waiting",
      },
    ];
  };
  // const getFinalApproverMatrix = () => {
  //   const user = props.currentSPContext.pageContext.user;

  //   return [
  //     {
  //       Id: header.reportingManagerId,
  //       Name: header.reportingManager,
  //       Role: "RM",
  //       Level: 1,
  //       Status: "Pending",
  //     },
  //     {
  //       Id: user.id,
  //       Name: user.displayName,
  //       Role: "FS",
  //       Level: 2,
  //       Status: "Pending",
  //     },
  //     {
  //       Id: 0,
  //       Name: "",
  //       Role: "SecurityAdmin",
  //       Level: 3,
  //       Status: "Pending",
  //     }
  //   ];
  // };
  // const approverMatrix = [
  //   {
  //     UserName: props.currentSPContext.pageContext.user.displayName,
  //     Status: "Pending",
  //     UserID: props.currentSPContext.pageContext.user.loginName,
  //     UserEmail: props.currentSPContext.pageContext.user.email,
  //     Sequence: 1
  //   }
  // ];

  const workflowEntry = buildWorkflowHistory("Pending For Approver");
  const [items, setItems] = useState([
    {
      sr: 1,
      description: "",
      quantity: "",
      approx: "",
      date: "",
      purpose: "",
    },
  ]);
  const addRow = () => {
    setItems([
      ...items,
      {
        sr: items.length + 1,
        description: "",
        quantity: "",
        approx: "",
        date: "",
        purpose: "",
      },
    ]);
  };

  const removeRow = (index: number) => {
    const data = [...items];

    data.splice(index, 1);

    setItems(data);
  };
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [noOfItems, setNoOfItems] = useState("1");
  const [itemsPerBox, setItemsPerBox] = useState("");
  const [uom, setUom] = useState("");
  const [returnable, setReturnable] = useState("");
  const [remarks, setRemarks] = useState("");
  //const [ApproveType, setApproveType] = useState("");
  const [ApproveType, setApproveType] = useState<any[]>([]);
  //    const [approverDetails, setApproverDetails] = useState<IApproverDetails[]>([]);
  const history = useHistory();

  const loadData = async () => {
    const email = props.currentSPContext.pageContext.user.email;

    const bal = Request();

    const data = await bal.getRequestdata(
      `Employee/EMail eq '${email}'`,
      { column: "Id", isAscending: false },
      props,
    );

    if (data.length > 0) {
      const user = data[0];

      setHeader({
        EmployeeName: user.EmployeeName || "",
        department: user.Department || "",
        reportingManagerId: user.ReportingManagerId || 0,
        reportingManager: user.ReportingManager || "",
      });
    }
  };
  async function loadApproverMatricstype() {
    try {
      const spCrudOps = await SPCRUDOPS();
      const amData = await spCrudOps.getData(
        "ApproveMatrics",
        "Id,CurrentApprover/Id,CurrentApprover/Title,Role,Status,Level",
        "CurrentApprover",
        "Status eq 'Active'",
        { column: "ID", isAscending: true },
        props,
      );

      console.log("LC Type Data:", amData);
      setApproveType(amData);
    } catch (err) {
      console.error("Error loading customers:", err);
    }
  }
  // const getFinalApproverMatrix = () => {
  //   if (!ApproveType || ApproveType.length === 0) return [];
  //   const baseApprovers = [];
  //   const matrixApprovers = [];
  //   return ApproveType.map((item: any) => {
  //     if (item.Role === "RM") {
  //       baseApprovers.push({
  //         Id: header.reportingManagerId,
  //         Name: header.reportingManager,
  //         Role: "RM",
  //         Level: item.Level,
  //         Status: "Pending",
  //       });
  //     }

  //     matrixApprovers.push({
  //       Id: item.CurrentApprover?.Id || 0,
  //       Name: item.CurrentApprover?.Title || "",
  //       Role: item.Role,
  //       Level: item.Level,
  //       Status: "Waiting",
  //     });
  //   });
  //   const fullFlow = [...baseApprovers, ...matrixApprovers];
  //   setApproverDetails(fullFlow);
  // };
const getFinalApproverMatrix = () => {
  if (!ApproveType || ApproveType.length === 0) return;

  const baseApprovers: any[] = [];
  const matrixApprovers: any[] = [];

 
   baseApprovers.push({
        Id: header.reportingManagerId,
        Name: header.reportingManager,
        Role: "RM",
        Level: 1,
        Status: "Pending",
      });
       ApproveType.forEach((item: any) => {
      matrixApprovers.push({
        Id: item.CurrentApprover?.Id || 0,
        Name: item.CurrentApprover?.Title || "",
        Role: item.Role,
        Level: item.Level +1,
        Status: "Waiting",
      });
    
  });

  const fullFlow = [...baseApprovers, ...matrixApprovers].sort(
    (a, b) => a.Level - b.Level
  );

  setApproverDetails(fullFlow);

  console.log("Approver Flow:", fullFlow);
};
  const loadApproverData = async () => {
    try {
      const email = props.currentSPContext.pageContext.user.email;

      const bal = ApproverMatrics();

      const data = await bal.getApproverdata(
        `CurrentApprover/EMail eq '${email}'`,
        { column: "Level", isAscending: true },
        props,
      );

      setApproverMatrix(data || []);
    } catch (error) {
      console.error(error);
      setApproverMatrix([]);
    }
  };
  const vendorService = Vendor();

  const loadVendors = async () => {
    const data = await vendorService.getVendordata(
      "",
      { column: "Id", isAscending: true },
      props,
    );

    setVendors(data);
  };

  const loadLocations = async () => {
    const locationService = Location();
    const data = await locationService.getLocationdata(
      "",
      { column: "Id", isAscending: true },
      props,
    );

    setLocations(data);
  };

  const handleSubmit = async () => {
    if (isSubmitLoading) return;
    try {
      if (!selectedVendor) {
        alert("Please select Vendor");
        return;
      }

      const vendorAddress = vendors.find(
        (v) => v.Id === Number(selectedVendor),
      )?.Address;

      if (!vendorAddress) {
        alert("Vendor address missing");
        return;
      }

      if (!selectedLocation) {
        alert("Please select Location");
        return;
      }

      if (!noOfItems || Number(noOfItems) <= 0) {
        alert("Please enter No of Items");
        return;
      }
      if (!uom) {
        alert("Please select UOM");
        return;
      }

      if (!itemsPerBox || Number(itemsPerBox) <= 0) {
        alert("Please enter No of Items in Box");
        return;
      }

      if (!returnable) {
        alert("Please select Gatepass Returnable option");
        return;
      }

      // if (items.length !== Number(noOfItems)) {
      //   alert("No of Items does not match added rows");
      //   return;
      // }

      if (items.length !== Math.max(1, Number(noOfItems))) {
        alert("No of Items does not match added rows");
        return;
      }

      for (let i = 0; i < items.length; i++) {
        const row = items[i];

        if (
          !row.description ||
          !row.quantity ||
          !row.approx ||
          !row.date ||
          !row.purpose
        ) {
          alert(`Please fill all fields in row ${i + 1}`);
          return;
        }
      }
      if (!supportingFiles || supportingFiles.length === 0) {
  alert("Please attach supporting document");
  return;
}

      const workflowHistory = [
        buildWorkflowHistory("Pending For Approver", remarks),
      ];
      //   const finalMatrix = getFinalApproverMatrix();

      // const firstApprover = [...finalMatrix].sort((a, b) => a.Level - b.Level)[0];

      // if (!firstApprover || !firstApprover.Id) {
      //   alert("Approver not configured. Please contact admin.");
      //   setIsSubmitting(false);
      //   return;
      // }

      setIsSubmitLoading(true);

      //const firstApprover = finalMatrix.find(a => a.Level === 1);
      const gatePassService = GatePass();
      const childService = AuthorisedSignatories();
      const allApproversJson = JSON.stringify(approverDetails);
 const currentApprover =
                approverDetails.length > 0 ? approverDetails[0] : null;
      const payload: IGatePass = {
        EmployeeName: header.EmployeeName,
        Department: header.department,
        ReportingManagerId: header.reportingManagerId,
        CurrentApproverId: header.reportingManagerId,
        //CurrentApproverId: firstApprover?.Id || 0,
        VendorNameId: Number(selectedVendor),
        Address: vendorAddress,
        CityId: Number(selectedLocation),
        NoItems: Number(noOfItems),
        UOM: uom,
        NoBox: Number(itemsPerBox),
        GatePassReturnable: returnable,
        Remarks: remarks,
        Status: "Pending For Approver",
        WFH: JSON.stringify(workflowHistory),
        ApproverMatrics: allApproversJson,
        //ApproverMatrics: JSON.stringify(getFinalApproverMatrix()),
        //ApproverMatrics: JSON.stringify(finalMatrix),
      };

      const response = await gatePassService.saveRequest(payload, props);
      const gatePassId = response.data.Id;

if (supportingFiles.length > 0) {
  const sp = await SPCRUDOPS();
  const folderUrl = "/sites/NBCGatePass/SupportingDocs";

  for (const file of supportingFiles) {

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

  
    const dotIndex = file.name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
    const extension = dotIndex !== -1 ? file.name.substring(dotIndex) : "";

  
    const newFileName = `${baseName}_${timestamp}${extension}`;


    const renamedFile = new File([file], newFileName, { type: file.type });

    const uploadRes = await sp.uploadFile(folderUrl, renamedFile, props);

    const fileItem = uploadRes.file;
    const item = await fileItem.getItem();

    const itemId = item.Id;

    if (!itemId) {
      throw new Error("File uploaded but List Item ID not found");
    }

    await sp.updateData(
      "SupportingDocs",
      itemId,
      {
        GatePassID: String(gatePassId)
      },
      props
    );
  }
}

      for (const item of items) {
        const childPayload = {
          Title: "Item",
          GatePassIDId: gatePassId,
          DescriptionMaterial: item.description,
          Quantity: Number(item.quantity),
          ApproximateValue: item.approx,

          ProbableDate: item.date || null,

          PurposeMovement: item.purpose,
        };

        await childService.saveItem(childPayload, props);
      }

      alert("Request submitted successfully!");
      history.push("/RequesterDashboard");
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isDraftLoading) return;
    try {
      // if (!selectedVendor) {
      //   alert("Please select Vendor");
      //   return;
      // }

      // const vendorAddress =
      //   vendors.find((v) => v.Id === Number(selectedVendor))?.Address;

      // if (!vendorAddress) {
      //   alert("Vendor address missing");
      //   return;
      // }

      //
      // if (!selectedLocation) {
      //   alert("Please select Location");
      //   return;
      // }

      // OPTIONAL (recommended)
      // if (!noOfItems || Number(noOfItems) <= 0) {
      //   alert("Please enter No of Items");
      //   return;
      // }

      // if (items.length !== Number(noOfItems)) {
      //   alert("No of Items does not match added rows");
      //   return;
      // }

      // if (!itemsPerBox || Number(itemsPerBox) <= 0) {
      //   alert("Please enter No of Items in Box");
      //   return;
      // }

     setIsDraftLoading(true);

      const gatePassService = GatePass();
      const childService = AuthorisedSignatories();

      const payload: IGatePass = {
        EmployeeName: header.EmployeeName,
        Department: header.department,
        ReportingManagerId: header.reportingManagerId,
        CurrentApproverId: header.reportingManagerId,
        VendorNameId: Number(selectedVendor),
        Address:
          vendors.find((v) => v.Id === Number(selectedVendor))?.Address || "",

        CityId: Number(selectedLocation),

        NoItems: Number(noOfItems),
        UOM: uom,
        NoBox: Number(itemsPerBox),
        GatePassReturnable: returnable,
        Remarks: remarks,
        Status: "Draft",

        //     WFH: JSON.stringify([
        //   buildWorkflowHistory("Draft", "Saved as Draft")
        // ]),
      };

      // Save Parent
      const response = await gatePassService.saveRequest(payload, props);

      const gatePassId = response.data.Id;

if (supportingFiles && supportingFiles.length > 0) {
  const sp = await SPCRUDOPS();
  const folderUrl = "/sites/NBCGatePass/SupportingDocs";

  for (const file of supportingFiles) {

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    const dotIndex = file.name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
    const extension = dotIndex !== -1 ? file.name.substring(dotIndex) : "";

    const newFileName = `${baseName}_${timestamp}${extension}`;

    const renamedFile = new File([file], newFileName, { type: file.type });

    const uploadRes = await sp.uploadFile(folderUrl, renamedFile, props);

    const fileItem = uploadRes.file;
    const item = await fileItem.getItem();
    const itemId = item.Id;

    if (!itemId) {
      throw new Error("File uploaded but List Item ID not found");
    }

    await sp.updateData(
      "SupportingDocs",
      itemId,
      {
        GatePassID: String(gatePassId)
      },
      props
    );
  }
}

      // Save Child Rows
      for (const item of items) {
        const childPayload = {
          // Title: "Item",

          GatePassIDId: gatePassId,

          DescriptionMaterial: item.description,
          Quantity: Number(item.quantity),
          ApproximateValue: item.approx,
          ProbableDate: item.date || null,

          PurposeMovement: item.purpose,
        };

        await childService.saveItem(childPayload, props);
      }

      alert("Request successfully saved as draft");
      history.push("/RequesterDashboard");
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    } finally {
     setIsDraftLoading(false);
    }
  };
  useEffect(() => {
    const initialize = async () => {
      await loadData();
      await loadVendors();
      await loadApproverMatricstype();
      await loadLocations();
      await loadApproverData();
      // await getFinalApproverMatrix();
    };
    initialize();
  }, []);
  useEffect(() => {
  if (
    ApproveType.length > 0 &&
    header.reportingManagerId > 0
  ) {
    getFinalApproverMatrix();
  }
}, [ApproveType, header]);

  return (
    <div className="new-request">
      <h3 className="page-title">New Request Form</h3>
      <div className="approval-ribbon">
        <div className="ribbon-step approved">{"Initiator"}</div>
{/* initiator */}
        {approverDetails.map((approver, index) => (
          <div key={index} className="ribbon-step approver">
            {approver.Name}
          </div>
        ))}
      </div>

      <div className="section-title">Request Information</div>

      <div className="form-grid">
        <div>
          <label>Request By</label>
          <input type="text" value={header.EmployeeName} readOnly />
        </div>

        <div>
          <label>Department</label>
          <input type="text" value={header.department} readOnly />
        </div>

        <div>
          <label>Reporting Manager</label>
          <input
            type="text"
            value={header.reportingManager}
            onChange={(e) =>
              setHeader({ ...header, reportingManager: e.target.value })
            }
          />
        </div>

        <div>
          <label>Name of Vendor *</label>

          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
          >
            <option value="">--Select--</option>

            {vendors.map((v) => (
              <option key={v.Id} value={v.Id}>
                {v.VendorName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Address of Vendor *</label>

          <textarea
            readOnly
            value={
              vendors.find((v) => v.Id === Number(selectedVendor))?.Address ||
              ""
            }
          />
        </div>

        <div>
          <label>Location *</label>

          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">--Select--</option>

            {locations.map((loc) => (
              <option key={loc.Id} value={loc.Id}>
                {loc.City}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>No of Items *</label>

          <input
            type="text"
            value={noOfItems}
            onChange={(e) => {
              const value = e.target.value;

              if (/^\d*$/.test(value)) {
                setNoOfItems(value);

                if (value === "") return;

                let count = Number(value);

                if (count <= 0) count = 1;

                const newItems = Array.from({ length: count }, (_, i) => {
                  return (
                    items[i] || {
                      sr: i + 1,
                      description: "",
                      quantity: "",
                      approx: "",
                      date: "",
                      purpose: "",
                    }
                  );
                });

                setItems(newItems);
              }
            }}
          />
        </div>

        <div>
          <label>UOM</label>

          <select value={uom} onChange={(e) => setUom(e.target.value)}>
            <option value="">--Select--</option>
            <option value="Box">Box</option>
            <option value="Packets">Packets</option>
          </select>
        </div>

        <div>
          <label>No of Items in box *</label>
          <input
            type="text"
            value={itemsPerBox}
            onChange={(e) => {
              const value = e.target.value;

              // allow only numbers
              if (/^\d*$/.test(value)) {
                setItemsPerBox(value);
              }
            }}
          />

          {/* <input
            type="text"
            value={itemsPerBox}
            onChange={(e) => {
              const value = e.target.value;

              if (/^\d*$/.test(value)) {
                setItemsPerBox(value);

                // OPTIONAL: update quantity in each row
                const updatedItems = items.map((item) => ({
                  ...item,
                  quantity: value,
                }));

                setItems(updatedItems);
              }
            }}
          /> */}
        </div>

        <div>
          <label>Gatepass is returnable or not ?</label>

          <select
            value={returnable}
            onChange={(e) => setReturnable(e.target.value)}
          >
            <option value="">--Select--</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
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
            <th>Approximate Value</th>
            <th>Probable Date</th>
            <th>Purpose for Movement</th>
            {/* <th>Action</th> */}
          </tr>
        </thead>

        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td>{index + 1}</td>

              <td>
                <input
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[index].description = e.target.value;
                    setItems(updated);
                  }}
                />
              </td>
              <td>
                <input
                  value={item.quantity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    const updated = [...items];
                    updated[index].quantity = value;
                    setItems(updated);
                  }}
                />
              </td>

              <td>
                <input
                  value={item.approx}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    const updated = [...items];
                    updated[index].approx = value;
                    setItems(updated);
                  }}
                />
              </td>

              <td>
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[index].date = e.target.value;
                    setItems(updated);
                  }}
                />
              </td>

              <td>
                <input
                  value={item.purpose}
                  onChange={(e) => {
                    const updated = [...items];
                    updated[index].purpose = e.target.value;
                    setItems(updated);
                  }}
                />
              </td>

              {/* <td>
                <button className="delete" onClick={() => removeRow(index)}>
                  ✖
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* <button className="add" onClick={addRow}>
        +
      </button> */}

      <div className="bottom-area">
        <div>
          <label>Remarks</label>

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* <div className="attach">Attach Supporting Documents </div> */}
        <div className="attach">
  <label>Attach Supporting Documents</label>

  <input
    type="file"
    multiple
    onChange={(e) => {
      if (e.target.files) {
        setSupportingFiles(Array.from(e.target.files));
      }
    }}
  />
</div>
       
      </div>

      <div className="buttons">
        <button
          className="draft"
          onClick={handleSaveDraft}
          disabled={isDraftLoading}
        
        >
          {isDraftLoading ? "Saving..." : "Save as Draft"}
        </button>

        <button
          className="submit"
          onClick={handleSubmit}
          disabled={isSubmitLoading}
        >
          {isSubmitLoading ? "Saving..." : "Submit"}
        </button>

        <button
          className="exit"
          onClick={() => history.push("/RequesterDashboard")}
        >
          Exit
        </button>
      </div>
    </div>
  );
};

export default NewRequest;
