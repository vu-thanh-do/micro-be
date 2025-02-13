-- Headcount Plan
select _ from tbRC_HeadCountPlan
-- Giai đoạn tuyển dụng
select _ from tbHR_RecruitmentPeriod
-- Tuyển mới/ tuyển thay thế
select _ from tbRC_Statistical_New_Replacement
-- Danh sách ứng viên
select _ from tbHR_RecruitmentCandidate
-- Kết quả phỏng vấn
select \* from tbHR_RecruitmentCandidateResult

-- Master data
select _ from tbMD_RecruitmentMethod
select _ from tbMD_RecruitmentStep
select _ from tbMD_RecruitmentStepCategory
select _ from tbMD_RecruitmentStepType

-- Cấu trúc phòng ban
select _ from tbMD_CompanyStructure
-- Khối sản xuất
select _ from tbMD_Direct_Indirect
-- Master tuyển mới/ tuyển thay thế
select _ from tbMD_GroupCode where [Group] = 'RCRTYP'
-- Nghỉ việc
select _ from tbHR_Resign





var element = document.querySelector("body > w3m-modal").shadowRoot.querySelector("wui-flex > wui-card > w3m-router").shadowRoot.querySelector("div > w3m-unsupported-chain-view").shadowRoot.querySelector("wui-flex > wui-flex:nth-child(2) > wui-list-network").shadowRoot.querySelector("button")

var elv2 = document.querySelector("body > w3m-modal").shadowRoot.querySelector("wui-flex > wui-card > w3m-router").shadowRoot.querySelector("div > w3m-connecting-siwe-view").shadowRoot.querySelector("wui-flex:nth-child(4) > wui-button:nth-child(2)")

if(element){
 element.click()
}
if(elv2 ){
elv2.click()
}
[12:04:14] Executed Không tìm thấy phần tử hoặc phần tử chưa được sinh ra. Hãy kiểm tra lại XPATH - "method":"xpath","selector":"//*[@id="layers"]/div[2]/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/button[2]"