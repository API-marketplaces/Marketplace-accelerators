from datetime import datetime
from pydantic import BaseModel, Field


class BusinessModelSection(BaseModel):
    companyName: str = ""
    industry: str = ""
    region: str = ""
    currentAccessModel: str = ""
    preferredChargingMethod: str = ""
    competitiveLandscape: str = ""


class CustomersSection(BaseModel):
    apiConsumerType: str = ""
    activeConsumers: str = ""
    consumerGrowthExpectation: str = ""
    perceivedBusinessValue: str = ""


class ApisSection(BaseModel):
    numberOfApis: str = ""
    monthlyTransactions: str = ""
    usageGrowth: str = ""


class RevenueSection(BaseModel):
    annualRevenueTarget: str = ""
    adoptionVsRevenue: str = ""
    premiumSupportNeeded: str = ""


class TechnologySection(BaseModel):
    apiGatewayProvider: str = ""
    technicalReadiness: str = ""
    dataInfrastructureMaturity: str = ""


class ObjectivesSection(BaseModel):
    primaryBusinessGoal: str = ""
    strategicImportance: str = ""
    targetTimeHorizon: str = ""


# Common business profile schema: one set of categorized sections, shared by
# create/update requests and by the stored/returned record, so every entry
# point produces and reads the same shape.
class BusinessProfileBase(BaseModel):
    profile_name: str = Field(..., min_length=1, max_length=150)
    business_model: BusinessModelSection = BusinessModelSection()
    customers: CustomersSection = CustomersSection()
    apis: ApisSection = ApisSection()
    revenue: RevenueSection = RevenueSection()
    technology: TechnologySection = TechnologySection()
    objectives: ObjectivesSection = ObjectivesSection()


class BusinessProfileCreate(BusinessProfileBase):
    pass


class BusinessProfileUpdate(BusinessProfileBase):
    pass


class BusinessProfileOut(BusinessProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
