const CLOUD_ENV = 'cloud1-d1gtel2d34c1309da';
const RECORDS_COLLECTION = 'records';
const SETTINGS_COLLECTION = 'settings';

let db = null;
let cloudReady = false;

function initCloud() {
  if (!wx.cloud) {
    cloudReady = false;
    return false;
  }

  wx.cloud.init({
    env: CLOUD_ENV,
    traceUser: true
  });
  db = wx.cloud.database();
  cloudReady = true;
  return true;
}

function isCloudReady() {
  return cloudReady && db;
}

function toCloudRecord(record) {
  return {
    localId: record.id,
    type: record.type,
    amount: Number(record.amount || 0),
    category: record.category,
    date: record.date,
    note: record.note || '',
    createdAt: record.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function fromCloudRecord(record) {
  return {
    id: record.localId || record.id || record._id,
    cloudId: record._id,
    type: record.type,
    amount: Number(record.amount || 0),
    category: record.category,
    date: record.date,
    note: record.note || '',
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function saveRecordToCloud(record) {
  if (!isCloudReady()) {
    return Promise.resolve(record);
  }

  const data = toCloudRecord(record);
  if (record.cloudId) {
    return db.collection(RECORDS_COLLECTION).doc(record.cloudId).update({
      data
    }).then(() => record);
  }

  return db.collection(RECORDS_COLLECTION)
    .where({ localId: record.id })
    .limit(1)
    .get()
    .then((result) => {
      const current = result.data && result.data[0];
      if (current) {
        return db.collection(RECORDS_COLLECTION).doc(current._id).update({
          data
        }).then(() => ({ _id: current._id }));
      }
      return db.collection(RECORDS_COLLECTION).add({
        data
      });
    })
    .then((result) => Object.assign({}, record, {
      cloudId: result._id,
      updatedAt: data.updatedAt
    }));
}

function deleteRecordFromCloud(record) {
  if (!isCloudReady() || !record) {
    return Promise.resolve();
  }

  if (record.cloudId) {
    return db.collection(RECORDS_COLLECTION).doc(record.cloudId).remove();
  }

  return db.collection(RECORDS_COLLECTION)
    .where({ localId: record.id })
    .get()
    .then((result) => {
      const tasks = (result.data || []).map((item) => {
        return db.collection(RECORDS_COLLECTION).doc(item._id).remove();
      });
      return Promise.all(tasks);
    });
}

function clearRecordsFromCloud() {
  if (!isCloudReady()) {
    return Promise.resolve();
  }

  return fetchAllCloudRecords().then((records) => {
    const tasks = records
      .filter((record) => record.cloudId)
      .map((record) => db.collection(RECORDS_COLLECTION).doc(record.cloudId).remove());
    return Promise.all(tasks);
  });
}

function fetchAllCloudRecords() {
  if (!isCloudReady()) {
    return Promise.resolve([]);
  }

  const pageSize = 100;
  const records = [];

  function fetchPage(skip) {
    return db.collection(RECORDS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get()
      .then((result) => {
        const page = result.data || [];
        records.push.apply(records, page);
        if (page.length < pageSize) {
          return records.map(fromCloudRecord);
        }
        return fetchPage(skip + pageSize);
      });
  }

  return fetchPage(0);
}

function mergeRecords(localRecords, cloudRecords) {
  const map = {};
  localRecords.forEach((record) => {
    map[record.cloudId || record.id] = record;
  });
  cloudRecords.forEach((record) => {
    map[record.cloudId || record.id] = record;
  });
  return Object.keys(map).map((key) => map[key]).sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) {
      return dateDiff;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

function syncUnsyncedRecords(localRecords) {
  if (!isCloudReady()) {
    return Promise.resolve(localRecords);
  }

  const tasks = localRecords
    .filter((record) => !record.cloudId)
    .map((record) => saveRecordToCloud(record));

  if (!tasks.length) {
    return Promise.resolve(localRecords);
  }

  return Promise.all(tasks).then((savedRecords) => {
    const savedMap = {};
    savedRecords.forEach((record) => {
      savedMap[record.id] = record;
    });
    return localRecords.map((record) => savedMap[record.id] || record);
  });
}

function syncRecords(localRecords) {
  if (!isCloudReady()) {
    return Promise.resolve(localRecords);
  }

  return syncUnsyncedRecords(localRecords).then((recordsWithCloudIds) => {
    return fetchAllCloudRecords().then((cloudRecords) => {
      return mergeRecords(recordsWithCloudIds, cloudRecords);
    });
  });
}

function saveSettingsToCloud(settings) {
  if (!isCloudReady()) {
    return Promise.resolve(settings);
  }

  const data = {
    monthlyBudget: settings.monthlyBudget,
    currency: settings.currency,
    categories: settings.categories,
    updatedAt: new Date().toISOString()
  };

  return db.collection(SETTINGS_COLLECTION)
    .limit(1)
    .get()
    .then((result) => {
      const current = result.data && result.data[0];
      if (current) {
        return db.collection(SETTINGS_COLLECTION).doc(current._id).update({
          data
        });
      }
      return db.collection(SETTINGS_COLLECTION).add({
        data
      });
    })
    .then(() => data);
}

function fetchSettingsFromCloud() {
  if (!isCloudReady()) {
    return Promise.resolve(null);
  }

  return db.collection(SETTINGS_COLLECTION)
    .limit(1)
    .get()
    .then((result) => {
      const settings = result.data && result.data[0] ? result.data[0] : null;
      if (!settings) {
        return null;
      }
      return {
        monthlyBudget: settings.monthlyBudget,
        currency: settings.currency,
        categories: settings.categories,
        updatedAt: settings.updatedAt
      };
    });
}

module.exports = {
  CLOUD_ENV,
  initCloud,
  isCloudReady,
  saveRecordToCloud,
  deleteRecordFromCloud,
  clearRecordsFromCloud,
  syncRecords,
  saveSettingsToCloud,
  fetchSettingsFromCloud
};
