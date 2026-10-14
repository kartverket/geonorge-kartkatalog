"use client"



export interface FeatureInfoProps {
results: any[]
}


export const FeatureInfo = ({ results }: FeatureInfoProps) => {
    console.log(JSON.stringify(results));
  return (
    <div>
      Feature Info Component
    </div>
  );
};