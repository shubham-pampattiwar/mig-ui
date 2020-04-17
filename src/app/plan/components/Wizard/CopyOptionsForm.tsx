import React, { useEffect } from 'react';
import { FormikProps } from 'formik';
import { isEmpty } from 'lodash';
import { IFormValues, IOtherProps } from './WizardContainer';
import CopyOptionsTable from './CopyOptionsTable';
import { IPlanPersistentVolume } from './types';

export const pvStorageClassAssignmentKey = 'pvStorageClassAssignment';
export const pvCopyMethodAssignmentKey = 'pvCopyMethodAssignment';

interface ICopyOptionsFormProps
  extends Pick<IOtherProps, 'clusterList' | 'currentPlan' | 'isFetchingPVList'>,
    Pick<FormikProps<IFormValues>, 'setFieldValue' | 'values'> {}

const CopyOptionsForm: React.FunctionComponent<ICopyOptionsFormProps> = ({
  clusterList,
  currentPlan,
  isFetchingPVList,
  setFieldValue,
  values,
}: ICopyOptionsFormProps) => {
  const migPlanPvs = currentPlan.spec.persistentVolumes;

  const destCluster = clusterList.find(
    c => c.MigCluster.metadata.name === currentPlan.spec.destMigClusterRef.name
  );

  const storageClasses = (destCluster && destCluster.MigCluster.spec.storageClasses) || [];

  // Build a pv => assignedStorageClass table, defaulting to the controller suggestion
  useEffect(() => {
    if (!values.pvStorageClassAssignment || isEmpty(values.pvStorageClassAssignment)) {
      let pvStorageClassAssignment = {};
      if (migPlanPvs) {
        pvStorageClassAssignment = migPlanPvs.reduce((assignedScs, pv) => {
          const suggestedStorageClass = storageClasses.find(
            sc => sc.name === pv.selection.storageClass
          );
          assignedScs[pv.name] = suggestedStorageClass ? suggestedStorageClass : '';
          return assignedScs;
        }, {});
      }
      setFieldValue(pvStorageClassAssignmentKey, pvStorageClassAssignment);
    }
    if (!values.pvCopyMethodAssignment || isEmpty(values.pvCopyMethodAssignment)) {
      let pvCopyMethodAssignment = {};
      if (migPlanPvs) {
        pvCopyMethodAssignment = migPlanPvs.reduce((assignedCms, pv) => {
          const supportedCopyMethods = pv.supported.copyMethods || [];
          const suggestedCopyMethod = supportedCopyMethods.find(
            cm => cm === pv.selection.copyMethod
          );
          assignedCms[pv.name] = suggestedCopyMethod
            ? suggestedCopyMethod
            : supportedCopyMethods[0];
          return assignedCms;
        }, {});
      }
      setFieldValue(pvCopyMethodAssignmentKey, pvCopyMethodAssignment);
    }
  }, []);

  const onStorageClassChange = (currentPV: IPlanPersistentVolume, value: string) => {
    const newSc = storageClasses.find(sc => sc.name === value) || '';
    const updatedAssignment = {
      ...values.pvStorageClassAssignment,
      [currentPV.name]: newSc,
    };
    setFieldValue(pvStorageClassAssignmentKey, updatedAssignment);
  };

  const onCopyMethodChange = (currentPV: IPlanPersistentVolume, value: string) => {
    const newCm = currentPV.supported.copyMethods.find(cm => cm === value);
    const updatedAssignment = {
      ...values.pvCopyMethodAssignment,
      [currentPV.name]: newCm,
    };
    setFieldValue(pvCopyMethodAssignmentKey, updatedAssignment);
  };

  return (
    <CopyOptionsTable
      isFetchingPVList={isFetchingPVList}
      currentPlan={currentPlan}
      persistentVolumes={
        values.persistentVolumes.length
          ? values.persistentVolumes.filter(v => v.type === 'copy')
          : []
      }
      pvStorageClassAssignment={values.pvStorageClassAssignment}
      pvCopyMethodAssignment={values.pvCopyMethodAssignment}
      storageClasses={storageClasses}
      onStorageClassChange={onStorageClassChange}
      onCopyMethodChange={onCopyMethodChange}
    />
  );
};
export default CopyOptionsForm;